import { Excalidraw, FONT_FAMILY } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback } from 'react'
import './engine.css'
import type { Engine } from './engine'

// The engine re-renders on every prop identity change, so these stay module-level.
const UI_OPTIONS = { tools: { image: false } }
const INITIAL_DATA = {
  appState: {
    currentItemRoughness: 0,
    currentItemStrokeWidth: 2,
    currentItemFillStyle: 'solid' as const,
    currentItemFontFamily: FONT_FAMILY.Helvetica,
    currentItemRoundness: 'round' as const,
  },
}

function createEngine(api: ExcalidrawImperativeAPI): Engine {
  return {
    scene: () => api.getSceneElements(),
  }
}

/** The canvas of a board. Fills its parent and hands back an Engine once ready. */
export function EngineCanvas({ onReady }: { onReady: (engine: Engine) => void }) {
  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => onReady(createEngine(api)),
    [onReady],
  )
  return (
    <Excalidraw
      excalidrawAPI={handleApi}
      UIOptions={UI_OPTIONS}
      initialData={INITIAL_DATA}
      handleKeyboardGlobally
    />
  )
}
