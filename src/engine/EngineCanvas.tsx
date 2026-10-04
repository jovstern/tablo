import { Excalidraw, FONT_FAMILY, hashElementsVersion } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback, useState } from 'react'
import './engine.css'
import type { Engine, Scene } from './engine'

// The engine re-renders on every prop identity change, so these stay stable.
const UI_OPTIONS = { tools: { image: false } }
const DEFAULT_APP_STATE = {
  currentItemRoughness: 0,
  currentItemStrokeWidth: 2,
  currentItemFillStyle: 'solid' as const,
  currentItemFontFamily: FONT_FAMILY.Helvetica,
  currentItemRoundness: 'round' as const,
}

function createEngine(api: ExcalidrawImperativeAPI): Engine {
  return {
    scene: () => api.getSceneElements(),

    onSceneChange(listener) {
      // The engine reports every change of any kind (pointer moves, selection), and
      // once on start-up, so compare scene versions and take the first as the baseline.
      let version: number | undefined
      return api.onChange((elements) => {
        const next = hashElementsVersion(elements)
        if (version !== undefined && next !== version) listener()
        version = next
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
