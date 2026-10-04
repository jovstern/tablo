import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  Excalidraw,
  FONT_FAMILY,
  hashElementsVersion,
  newElementWith,
  ROUNDNESS,
} from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback, useState } from 'react'
import './engine.css'
import type { Engine, EngineState, Scene, SceneElement, Tool, Unsubscribe } from './engine'

// The engine re-renders on every prop identity change, so these stay stable.
const UI_OPTIONS = { tools: { image: false } }
const DEFAULT_APP_STATE = {
  currentItemRoughness: 0,
  currentItemStrokeWidth: 2,
  currentItemFillStyle: 'solid' as const,
  currentItemFontFamily: FONT_FAMILY.Helvetica,
  currentItemRoundness: 'round' as const,
}

const ENGINE_TOOLS = {
  select: 'selection',
  rectangle: 'rectangle',
  ellipse: 'ellipse',
  arrow: 'arrow',
  pen: 'freedraw',
  text: 'text',
} as const satisfies Record<Tool, string>

const TOOLS = Object.fromEntries(
  Object.entries(ENGINE_TOOLS).map(([tool, engineTool]) => [engineTool, tool]),
) as Record<string, Tool | undefined>

const STICKY_NOTE_SIZE = 200

/** Sends the engine a key press as if the visitor had typed it. It listens on the document. */
const pressKey = (key: KeyboardEventInit) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...key }))

type Elements = readonly SceneElement[]

const isSelected = (element: SceneElement, appState: AppState) =>
  appState.selectedElementIds[element.id] === true

/** The value all the elements share, or null if they disagree. */
const shared = <T,>(values: T[]): T | null =>
  values.every((value) => value === values[0]) ? values[0] : null

function readState(elements: Elements, appState: AppState): EngineState {
  const selected = elements.filter((element) => isSelected(element, appState))
  const hasSelection = selected.length > 0
  return {
    tool: TOOLS[appState.activeTool.type] ?? null,
    hasSelection,
    style: hasSelection
      ? {
          strokeColor: shared(selected.map((element) => element.strokeColor)),
          fill: shared(selected.map((element) => element.backgroundColor)),
          strokeWidth: shared(selected.map((element) => element.strokeWidth)),
        }
      : {
          strokeColor: appState.currentItemStrokeColor,
          fill: appState.currentItemBackgroundColor,
          strokeWidth: appState.currentItemStrokeWidth,
        },
  }
}

const sameState = (a: EngineState, b: EngineState) =>
  a.tool === b.tool &&
  a.hasSelection === b.hasSelection &&
  a.style.strokeColor === b.style.strokeColor &&
  a.style.fill === b.style.fill &&
  a.style.strokeWidth === b.style.strokeWidth

function createEngine(api: ExcalidrawImperativeAPI): Engine {
  let state = readState(api.getSceneElements(), api.getAppState())
  const stateListeners = new Set<() => void>()

  // The engine reports every change of any kind, so only pass on real ones:
  // the chrome re-renders on each, and an unguarded update loops.
  const refresh = (elements: Elements, appState: AppState) => {
    const next = readState(elements, appState)
    if (sameState(state, next)) return
    state = next
    stateListeners.forEach((listener) => listener())
  }
  // Subscribed only while someone listens. The engine drops its subscribers when
  // it unmounts, which React's StrictMode makes it do once right after mounting.
  let stopWatching: Unsubscribe | undefined

  return {
    scene: () => api.getSceneElements(),

    onSceneChange(listener) {
      // Compare scene versions, and take the first report (sent on start-up) as the baseline.
      let version: number | undefined
      return api.onChange((elements) => {
        const next = hashElementsVersion(elements)
        if (version !== undefined && next !== version) listener()
        version = next
      })
    },

    state: () => state,

    onStateChange(listener) {
      stateListeners.add(listener)
      if (stateListeners.size === 1) {
        stopWatching = api.onChange(() => refresh(api.getSceneElements(), api.getAppState()))
        refresh(api.getSceneElements(), api.getAppState())
      }
      return () => {
        stateListeners.delete(listener)
        if (stateListeners.size === 0) stopWatching?.()
      }
    },

    setTool: (tool) => api.setActiveTool({ type: ENGINE_TOOLS[tool] }),

    applyStyle({ strokeColor, fill, strokeWidth }) {
      const appState = api.getAppState()
      const patch = {
        ...(strokeColor !== undefined && { strokeColor }),
        ...(fill !== undefined && { backgroundColor: fill }),
        ...(strokeWidth !== undefined && { strokeWidth }),
      }
      const elements = api.getSceneElements().map((element) => {
        if (isSelected(element, appState)) return newElementWith(element, patch)
        // Text bound to a selected element follows its stroke colour, as in the engine's own UI.
        const container = element.type === 'text' ? element.containerId : null
        if (container && appState.selectedElementIds[container] && strokeColor !== undefined) {
          return newElementWith(element, { strokeColor })
        }
        return element
      })
      api.updateScene({
        elements,
        appState: {
          currentItemStrokeColor: strokeColor ?? appState.currentItemStrokeColor,
          currentItemBackgroundColor: fill ?? appState.currentItemBackgroundColor,
          currentItemStrokeWidth: strokeWidth ?? appState.currentItemStrokeWidth,
        },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      })
    },

    addStickyNote({ fill, ink }) {
      const appState = api.getAppState()
      const zoom = appState.zoom.value
      const [note] = convertToExcalidrawElements([
        {
          type: 'rectangle',
          x: appState.width / 2 / zoom - appState.scrollX - STICKY_NOTE_SIZE / 2,
          y: appState.height / 2 / zoom - appState.scrollY - STICKY_NOTE_SIZE / 2,
          width: STICKY_NOTE_SIZE,
          height: STICKY_NOTE_SIZE,
          backgroundColor: fill,
          strokeColor: ink,
          strokeWidth: 1,
          fillStyle: 'solid',
          roughness: 0,
          roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
        },
      ])
      // The engine has no call to start editing bound text, and new text takes the
      // current stroke colour. So: select the note with ink as the current colour,
      // press Enter for the visitor (which opens the text editor), then put the colour back.
      const strokeColor = appState.currentItemStrokeColor
      api.updateScene({
        elements: [...api.getSceneElements(), note],
        appState: { selectedElementIds: { [note.id]: true }, currentItemStrokeColor: ink },
        // Folded into the undo step the text editor records when it closes, so that
        // one undo removes the note whether or not anything was typed into it.
        captureUpdate: CaptureUpdateAction.EVENTUALLY,
      })
      requestAnimationFrame(() => {
        pressKey({ key: 'Enter' })
        requestAnimationFrame(() =>
          api.updateScene({ appState: { currentItemStrokeColor: strokeColor } }),
        )
      })
    },
  }
}

type Props = {
  /** The scene to start from. Read once; later changes are ignored. */
  initialScene?: Scene | null
  onReady: (engine: Engine) => void
}

/** The canvas of a board. Fills its parent and hands back an Engine once ready. */
export function EngineCanvas({ initialScene, onReady }: Props) {
  const [initialData] = useState(() => ({
    elements: initialScene?.elements ?? [],
    appState: DEFAULT_APP_STATE,
  }))
  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => onReady(createEngine(api)),
    [onReady],
  )
  return (
    <Excalidraw
      excalidrawAPI={handleApi}
      UIOptions={UI_OPTIONS}
      initialData={initialData}
      handleKeyboardGlobally
    />
  )
}
