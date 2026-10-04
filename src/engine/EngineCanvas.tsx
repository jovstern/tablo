import { Excalidraw, FONT_FAMILY } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback, useRef, useState } from 'react'
import './engine.css'
import type { Engine, Scene, Theme } from './engine'
import { createEngine } from './excalidrawEngine'

// The engine re-renders on every prop identity change, so these stay stable.
const UI_OPTIONS = { tools: { image: false } }
const DEFAULT_APP_STATE = {
  currentItemRoughness: 0,
  currentItemStrokeWidth: 2,
  currentItemFillStyle: 'solid' as const,
  currentItemFontFamily: FONT_FAMILY.Helvetica,
  currentItemRoundness: 'round' as const,
}

type Props = {
  /** The scene to start from. Read once; later changes are ignored. */
  initialScene?: Scene | null
  theme: Theme
  onReady: (engine: Engine) => void
}

/** The canvas of a board. Fills its parent and hands back an Engine once ready. */
export function EngineCanvas({ initialScene, theme, onReady }: Props) {
  const [initialData] = useState(() => ({
    elements: initialScene?.elements ?? [],
    appState: DEFAULT_APP_STATE,
  }))
  const container = useRef<HTMLDivElement>(null)
  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => onReady(createEngine(api, container.current!)),
    [onReady],
  )
  return (
    <div ref={container} className="h-full w-full">
      <Excalidraw
        excalidrawAPI={handleApi}
        UIOptions={UI_OPTIONS}
        initialData={initialData}
        theme={theme}
        handleKeyboardGlobally
      />
    </div>
  )
}
