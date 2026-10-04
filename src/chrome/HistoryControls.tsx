import { Redo2, Undo2 } from 'lucide-react'
import type { Engine } from '../engine/engine'
import { useEngineState } from '../engine/useEngineState'
import { card, iconButton, keepCanvasFocus } from './ui'

/** Bottom left: undo and redo, each enabled only when it would do something. */
export function HistoryControls({ engine }: { engine: Engine }) {
  const { canUndo, canRedo } = useEngineState(engine)
  return (
    <div className={`${card} flex h-11 items-center px-1.5`}>
      <button
        type="button"
        aria-label="Undo"
        title="Undo"
        disabled={!canUndo}
        onMouseDown={keepCanvasFocus}
        onClick={engine.undo}
        className={iconButton}
      >
        <Undo2 size={16} />
      </button>
      <button
        type="button"
        aria-label="Redo"
        title="Redo"
        disabled={!canRedo}
        onMouseDown={keepCanvasFocus}
        onClick={engine.redo}
        className={iconButton}
      >
        <Redo2 size={16} />
      </button>
    </div>
  )
}
