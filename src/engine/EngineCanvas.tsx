import { Excalidraw, FONT_FAMILY, hashElementsVersion } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback, useState } from 'react'
import './engine.css'
import type { Engine, EngineState, Scene, Tool, Unsubscribe } from './engine'

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

const readState = (appState: AppState): EngineState => ({
  tool: TOOLS[appState.activeTool.type] ?? null,
})

const sameState = (a: EngineState, b: EngineState) => a.tool === b.tool

function createEngine(api: ExcalidrawImperativeAPI): Engine {
  let state = readState(api.getAppState())
  const stateListeners = new Set<() => void>()

  // The engine reports every change of any kind, so only pass on real ones:
  // the chrome re-renders on each, and an unguarded update loops.
  const refresh = (appState: AppState) => {
    const next = readState(appState)
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
        stopWatching = api.onChange((_elements, appState) => refresh(appState))
        refresh(api.getAppState())
      }
      return () => {
        stateListeners.delete(listener)
        if (stateListeners.size === 0) stopWatching?.()
      }
    },

    setTool: (tool) => api.setActiveTool({ type: ENGINE_TOOLS[tool] }),
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
