import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  exportToBlob,
  exportToSvg,
  hashElementsVersion,
  newElementWith,
  reconcileElements,
  restoreElements,
  ROUNDNESS,
} from '@excalidraw/excalidraw'
import type { RemoteExcalidrawElement } from '@excalidraw/excalidraw/data/reconcile'
import type { AppState, ExcalidrawImperativeAPI, SocketId } from '@excalidraw/excalidraw/types'
import type { Engine, EngineState, Point, SceneElement, Tool, Unsubscribe } from './engine'

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
const EXPORT_MARGIN = 24

/** Sends the engine a key press as if the visitor had typed it. It listens on the document. */
const pressKey = (key: KeyboardEventInit) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...key }))

/**
 * The engine has no public call for undo or redo and no way to ask whether they
 * are available. Its own buttons are still in the DOM, only hidden, so the adapter
 * presses and reads those. They sit in different places in the engine's wide and
 * narrow layouts, so look in the whole container.
 */
const engineButton = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)

const canPress = (container: HTMLElement, name: string) =>
  engineButton(container, name)?.disabled === false

/**
 * Where the engine's pointer reports arrive. The engine hands them to a prop of
 * its component, not to its imperative API, so the canvas component feeds this.
 */
export type PointerMoves = {
  publish(point: Point): void
  subscribe(listener: (point: Point) => void): Unsubscribe
}

export function createPointerMoves(): PointerMoves {
  const listeners = new Set<(point: Point) => void>()
  return {
    publish: (point) => listeners.forEach((listener) => listener(point)),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.1
const MAX_ZOOM = 30

type Elements = readonly SceneElement[]

const isSelected = (element: SceneElement, appState: AppState) =>
  appState.selectedElementIds[element.id] === true

/** The value all the elements share, or null if they disagree. */
const shared = <T>(values: T[]): T | null =>
  values.every((value) => value === values[0]) ? values[0] : null

function readState(elements: Elements, appState: AppState, container: HTMLElement): EngineState {
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
    canUndo: canPress(container, 'Undo'),
    canRedo: canPress(container, 'Redo'),
    zoom: appState.zoom.value,
  }
}

const sameValues = <T extends object>(a: T, b: T) =>
  (Object.keys(a) as (keyof T)[]).every((key) => a[key] === b[key])

const sameState = ({ style: styleA, ...a }: EngineState, { style: styleB, ...b }: EngineState) =>
  sameValues(a, b) && sameValues(styleA, styleB)

/**
 * Builds tablo's Engine on Excalidraw's imperative API. `container` is the element
 * the engine renders into, which is where its own (hidden) controls live.
 */
export function createEngine(
  api: ExcalidrawImperativeAPI,
  container: HTMLElement,
  pointerMoves: PointerMoves,
): Engine {
  const read = () => readState(api.getSceneElements(), api.getAppState(), container)
  let state = read()
  const stateListeners = new Set<() => void>()

  // The engine reports every change of any kind, so only pass on real ones:
  // the chrome re-renders on each, and an unguarded update loops.
  const refresh = () => {
    const next = read()
    if (sameState(state, next)) return
    state = next
    stateListeners.forEach((listener) => listener())
  }

  /** Zooms about the centre of the view: the scene point there stays where it is. */
  const zoomTo = (level: number) => {
    const { zoom, scrollX, scrollY, width, height } = api.getAppState()
    // Rounded so that repeated steps land on whole percentages.
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(level * 100) / 100))
    const shift = (size: number) => size / 2 / next - size / 2 / zoom.value
    api.updateScene({
      appState: {
        zoom: { value: next as typeof zoom.value },
        scrollX: scrollX + shift(width),
        scrollY: scrollY + shift(height),
      },
    })
  }

  // Watches only while someone listens. The engine drops its subscribers when
  // it unmounts, which React's StrictMode makes it do once right after mounting.
  let stopWatching: Unsubscribe | undefined
  const watch = (): Unsubscribe => {
    const stopChanges = api.onChange(refresh)
    // The engine's own buttons re-render on their own schedule, after it reports a change.
    const buttons = new MutationObserver(refresh)
    buttons.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['disabled'],
    })
    return () => {
      stopChanges()
      buttons.disconnect()
    }
  }

  return {
    scene: () => ({ elements: api.getSceneElements() }),
    sceneWithTombstones: () => ({ elements: api.getSceneElementsIncludingDeleted() }),

    onActivity(listener) {
      let pointer: Point | null = null
      let selection = ''
      const selectedIds = () => Object.keys(api.getAppState().selectedElementIds)
      const stopPointer = pointerMoves.subscribe((point) => {
        pointer = point
        listener({ pointer, selectedIds: selectedIds() })
      })
      const stopSelection = api.onChange(() => {
        const ids = selectedIds()
        if (ids.join() === selection) return
        selection = ids.join()
        listener({ pointer, selectedIds: ids })
      })
      return () => {
        stopPointer()
        stopSelection()
      }
    },

    showParticipants(participants) {
      api.updateScene({
        collaborators: new Map(
          participants.map(({ id, name, colour, pointer, selectedIds }) => [
            id as SocketId,
            {
              id,
              username: name,
              color: { background: colour, stroke: colour },
              pointer: pointer ? { ...pointer, tool: 'pointer' as const } : undefined,
              selectedElementIds: Object.fromEntries(selectedIds.map((id) => [id, true as const])),
            },
          ]),
        ),
      })
    },

    shownParticipants: () =>
      [...api.getAppState().collaborators].map(([id, shown]) => ({
        id,
        name: shown.username ?? '',
        colour: shown.color?.background ?? '',
        pointer: shown.pointer ? { x: shown.pointer.x, y: shown.pointer.y } : null,
        selectedIds: Object.keys(shown.selectedElementIds ?? {}),
      })),

    applyRemoteElements(elements) {
      const remote = restoreElements(elements, null) as RemoteExcalidrawElement[]
      api.updateScene({
        elements: reconcileElements(
          api.getSceneElementsIncludingDeleted(),
          remote,
          api.getAppState(),
        ),
        captureUpdate: CaptureUpdateAction.NEVER,
      })
    },

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
        stopWatching = watch()
        refresh()
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

    undo: () => engineButton(container, 'Undo')?.click(),
    redo: () => engineButton(container, 'Redo')?.click(),
    zoomIn: () => zoomTo(api.getAppState().zoom.value + ZOOM_STEP),
    zoomOut: () => zoomTo(api.getAppState().zoom.value - ZOOM_STEP),
    resetZoom: () => zoomTo(1),

    async exportImage(format) {
      const appState = api.getAppState()
      const scene = {
        elements: api.getSceneElements(),
        appState: {
          ...appState,
          exportBackground: true,
          exportWithDarkMode: appState.theme === 'dark',
        },
        files: api.getFiles(),
        exportPadding: EXPORT_MARGIN,
      }
      if (format === 'png') return exportToBlob({ ...scene, mimeType: 'image/png' })
      const svg = await exportToSvg(scene)
      return new Blob([svg.outerHTML], { type: 'image/svg+xml' })
    },

    addStickyNote({ fill, ink, strokeWidth }) {
      const appState = api.getAppState()
      const zoom = appState.zoom.value
      const [stickyNote] = convertToExcalidrawElements([
        {
          type: 'rectangle',
          x: appState.width / 2 / zoom - appState.scrollX - STICKY_NOTE_SIZE / 2,
          y: appState.height / 2 / zoom - appState.scrollY - STICKY_NOTE_SIZE / 2,
          width: STICKY_NOTE_SIZE,
          height: STICKY_NOTE_SIZE,
          backgroundColor: fill,
          strokeColor: ink,
          strokeWidth,
          fillStyle: 'solid',
          roughness: 0,
          roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
        },
      ])
      // The engine has no call to start editing bound text, and new text takes the
      // current stroke colour. So: select the sticky note with ink as the current colour,
      // press Enter for the visitor (which opens the text editor), then put the colour back.
      const strokeColor = appState.currentItemStrokeColor
      api.updateScene({
        elements: [...api.getSceneElements(), stickyNote],
        appState: { selectedElementIds: { [stickyNote.id]: true }, currentItemStrokeColor: ink },
        // Folded into the undo step the text editor records when it closes, so that
        // one undo removes the sticky note whether or not anything was typed into it.
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
