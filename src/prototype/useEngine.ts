// PROTOTYPE: throwaway. Proves the chrome can drive Excalidraw with its own UI hidden.
import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  exportToBlob,
  exportToSvg,
  newElementWith,
  viewportCoordsToSceneCoords,
} from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback, useEffect, useState } from 'react'

export type Tool = 'selection' | 'rectangle' | 'ellipse' | 'arrow' | 'freedraw' | 'text'

export const STROKES = ['#1e1e1e', '#868e96', '#e03131', '#f08c00', '#2f9e44', '#1971c2', '#6741d9']
export const FILLS = ['transparent', '#e9ecef', '#ffc9c9', '#ffec99', '#b2f2bb', '#a5d8ff', '#d0bfff']
export const WIDTHS = [1, 2, 4]

export type Engine = ReturnType<typeof useEngine>

const key = (init: KeyboardEventInit) =>
  document.querySelector('.excalidraw')!.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))

const isMac = /Mac/.test(navigator.platform)
const mod = isMac ? { metaKey: true } : { ctrlKey: true }

export function useEngine() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [tool, setToolState] = useState<Tool>('selection')
  const [zoom, setZoom] = useState(1)
  const [hasSelection, setHasSelection] = useState(false)
  const [style, setStyle] = useState({ stroke: STROKES[0], fill: FILLS[0], width: 2 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) return
    ;(window as never as { __api: unknown }).__api = api
    return api.onChange((elements, appState) => {
      setToolState(appState.activeTool.type as Tool)
      setZoom(appState.zoom.value)
      setHasSelection(Object.keys(appState.selectedElementIds).length > 0)
      setCount(elements.filter((el) => !el.isDeleted).length)
      setStyle((prev) =>
        prev.stroke === appState.currentItemStrokeColor &&
        prev.fill === appState.currentItemBackgroundColor &&
        prev.width === appState.currentItemStrokeWidth
          ? prev
          : {
              stroke: appState.currentItemStrokeColor,
              fill: appState.currentItemBackgroundColor,
              width: appState.currentItemStrokeWidth,
            },
      )
    })
  }, [api])

  const setTool = useCallback((t: Tool) => api?.setActiveTool({ type: t }), [api])

  const applyStyle = useCallback(
    (patch: { strokeColor?: string; backgroundColor?: string; strokeWidth?: number }) => {
      if (!api) return
      const st = api.getAppState()
      const selected = st.selectedElementIds
      const elements = api.getSceneElements().map((el) => {
        const containerSelected = 'containerId' in el && el.containerId && selected[el.containerId]
        if (selected[el.id]) return newElementWith(el, patch)
        if (containerSelected && patch.strokeColor) return newElementWith(el, { strokeColor: patch.strokeColor })
        return el
      })
      api.updateScene({
        elements,
        appState: {
          ...(patch.strokeColor && { currentItemStrokeColor: patch.strokeColor }),
          ...(patch.backgroundColor && { currentItemBackgroundColor: patch.backgroundColor }),
          ...(patch.strokeWidth && { currentItemStrokeWidth: patch.strokeWidth }),
        } as never,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      })
    },
    [api],
  )

  const addSticky = useCallback(() => {
    if (!api) return
    const st = api.getAppState()
    const c = viewportCoordsToSceneCoords(
      { clientX: st.offsetLeft + st.width / 2, clientY: st.offsetTop + st.height / 2 },
      st,
    )
    const [note] = convertToExcalidrawElements([
      {
        type: 'rectangle',
        x: c.x - 100,
        y: c.y - 100,
        width: 200,
        height: 200,
        backgroundColor: '#ffec99',
        strokeColor: '#1e1e1e',
        strokeWidth: 1,
        fillStyle: 'solid',
        roughness: 0,
        roundness: { type: 3 },
      },
    ])
    api.updateScene({
      elements: [...api.getSceneElements(), note],
      appState: { selectedElementIds: { [note.id]: true } },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    })
    setTimeout(() => key({ key: 'Enter' }), 50)
  }, [api])

  const zoomTo = useCallback(
    (value: number) => {
      if (!api) return
      const st = api.getAppState()
      const v = Math.min(8, Math.max(0.1, value))
      // keep the viewport centre fixed
      const cx = st.width / 2
      const cy = st.height / 2
      const scrollX = st.scrollX + cx / v - cx / st.zoom.value
      const scrollY = st.scrollY + cy / v - cy / st.zoom.value
      api.updateScene({ appState: { zoom: { value: v as never }, scrollX, scrollY } })
    },
    [api],
  )

  const download = (blob: Blob, name: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
  }

  const exportPng = useCallback(async () => {
    if (!api) return
    const blob = await exportToBlob({
      elements: api.getSceneElements(),
      appState: { ...api.getAppState(), exportBackground: true },
      files: api.getFiles(),
      exportPadding: 24,
    })
    download(blob, 'tablo.png')
  }, [api])

  const exportSvg = useCallback(async () => {
    if (!api) return
    const svg = await exportToSvg({
      elements: api.getSceneElements(),
      appState: { ...api.getAppState(), exportBackground: true },
      files: api.getFiles(),
      exportPadding: 24,
    })
    download(new Blob([svg.outerHTML], { type: 'image/svg+xml' }), 'tablo.svg')
  }, [api])

  return {
    setApi,
    ready: !!api,
    tool,
    setTool,
    addSticky,
    style,
    applyStyle,
    hasSelection,
    count,
    undo: () => key({ key: 'z', code: 'KeyZ', ...mod }),
    redo: () => key({ key: 'z', code: 'KeyZ', shiftKey: true, ...mod }),
    zoom,
    zoomIn: () => zoomTo(zoom * 1.25),
    zoomOut: () => zoomTo(zoom / 1.25),
    zoomReset: () => zoomTo(1),
    exportPng,
    exportSvg,
  }
}
