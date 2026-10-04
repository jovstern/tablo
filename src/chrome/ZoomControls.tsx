import { Minus, Plus } from 'lucide-react'
import type { Engine } from '../engine/engine'
import { useEngineState } from '../engine/useEngineState'
import { card, iconButton, keepCanvasFocus } from './ui'

/** Bottom left: zoom out, the zoom level (which resets it when clicked) and zoom in. */
export function ZoomControls({ engine }: { engine: Engine }) {
  const { zoom } = useEngineState(engine)
  return (
    <div className={`${card} flex h-11 items-center px-1.5`}>
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        onMouseDown={keepCanvasFocus}
        onClick={engine.zoomOut}
        className={iconButton}
      >
        <Minus size={16} />
      </button>
      <button
        type="button"
        aria-label="Reset zoom"
        title="Reset zoom"
        onMouseDown={keepCanvasFocus}
        onClick={engine.resetZoom}
        className="h-9 w-14 rounded-xl text-center text-sm tabular-nums hover:bg-black/5"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        onMouseDown={keepCanvasFocus}
        onClick={engine.zoomIn}
        className={iconButton}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
