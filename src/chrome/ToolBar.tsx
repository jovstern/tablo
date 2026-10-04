import { ArrowUpRight, Circle, MousePointer2, Pencil, Square, StickyNote, Type } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Engine, Tool } from '../engine/engine'
import { useEngineState } from '../engine/useEngineState'
import { INK, STICKY_NOTE_FILL } from './palette'
import { card, keepCanvasFocus } from './ui'

const TOOLS: { tool: Tool; name: string; shortcut: string; icon: ReactNode }[] = [
  { tool: 'select', name: 'Select', shortcut: 'V', icon: <MousePointer2 size={18} /> },
  { tool: 'rectangle', name: 'Rectangle', shortcut: 'R', icon: <Square size={18} /> },
  { tool: 'ellipse', name: 'Ellipse', shortcut: 'O', icon: <Circle size={18} /> },
  { tool: 'arrow', name: 'Arrow', shortcut: 'A', icon: <ArrowUpRight size={18} /> },
  { tool: 'pen', name: 'Pen', shortcut: 'P', icon: <Pencil size={18} /> },
  { tool: 'text', name: 'Text', shortcut: 'T', icon: <Type size={18} /> },
]

const toolButton = 'grid h-10 w-10 place-items-center rounded-xl'

/** Bottom centre: picks the tool and shows which one is active. */
export function ToolBar({ engine }: { engine: Engine }) {
  const { tool: active } = useEngineState(engine)
  return (
    <div role="toolbar" aria-label="Tools" className={`${card} flex items-center gap-1 p-1.5`}>
      {TOOLS.map(({ tool, name, shortcut, icon }) => (
        <button
          key={tool}
          type="button"
          aria-label={name}
          aria-pressed={active === tool}
          title={`${name} (${shortcut})`}
          onMouseDown={keepCanvasFocus}
          onClick={() => engine.setTool(tool)}
          className={`${toolButton} ${
            active === tool
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {icon}
        </button>
      ))}
      <button
        type="button"
        aria-label="Sticky note"
        title="Sticky note"
        onMouseDown={keepCanvasFocus}
        onClick={() => engine.addStickyNote({ fill: STICKY_NOTE_FILL, ink: INK })}
        className={`${toolButton} hover:bg-black/5 dark:hover:bg-white/10`}
      >
        <StickyNote size={18} />
      </button>
    </div>
  )
}
