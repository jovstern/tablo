import { Excalidraw, FONT_FAMILY } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('input, textarea, [contenteditable]') !== null

/**
 * Whether a key press is one of the engine's shortcuts for a dialog of its own:
 * help (?), the command palette (Ctrl/Cmd+/ and Ctrl/Cmd+Shift+P), image export
 * (Ctrl/Cmd+Shift+E), and opening or saving a file (Ctrl/Cmd+O, Ctrl/Cmd+S).
 */
function opensEngineDialog(event: KeyboardEvent) {
  const mod = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()
  if (key === '?' && !mod) return !isTyping(event.target)
  if (!mod) return false
  if (key === '/' || key === 'o' || key === 's') return true
  return event.shiftKey && (key === 'e' || key === 'p')
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
  useEffect(() => {
    const swallow = (event: KeyboardEvent) => {
      if (opensEngineDialog(event)) event.stopImmediatePropagation()
    }
    // Capture on window: the engine listens for keys on the document.
    window.addEventListener('keydown', swallow, true)
    return () => window.removeEventListener('keydown', swallow, true)
  }, [])

  return (
    <div ref={container} className="h-full w-full">
      <Excalidraw
        excalidrawAPI={handleApi}
        UIOptions={UI_OPTIONS}
        initialData={initialData}
        theme={theme}
        // Pinned off: their shortcuts would otherwise lock the board or hide nothing useful,
        // with no control in the chrome to get back.
        viewModeEnabled={false}
        zenModeEnabled={false}
        handleKeyboardGlobally
      />
    </div>
  )
}
