// PROTOTYPE: throwaway shared bits. Layout is NOT shared; each variant owns its own.
import { ArrowUpRight, Circle, MousePointer2, Pencil, Square, StickyNote, Type } from 'lucide-react'
import type { ReactNode } from 'react'
import { FILLS, STROKES, WIDTHS, type Engine, type Tool } from './useEngine'

export const TOOLS: { id: Tool | 'sticky'; label: string; keyHint: string; icon: ReactNode }[] = [
  { id: 'selection', label: 'Select', keyHint: 'V', icon: <MousePointer2 size={18} /> },
  { id: 'rectangle', label: 'Rectangle', keyHint: 'R', icon: <Square size={18} /> },
  { id: 'ellipse', label: 'Ellipse', keyHint: 'O', icon: <Circle size={18} /> },
  { id: 'arrow', label: 'Arrow', keyHint: 'A', icon: <ArrowUpRight size={18} /> },
  { id: 'freedraw', label: 'Pen', keyHint: 'P', icon: <Pencil size={18} /> },
  { id: 'text', label: 'Text', keyHint: 'T', icon: <Type size={18} /> },
  { id: 'sticky', label: 'Sticky note', keyHint: 'S', icon: <StickyNote size={18} /> },
]

export const pickTool = (e: Engine, id: Tool | 'sticky') => (id === 'sticky' ? e.addSticky() : e.setTool(id))

const checker =
  'bg-[linear-gradient(45deg,#d4d4d8_25%,transparent_25%,transparent_75%,#d4d4d8_75%),linear-gradient(45deg,#d4d4d8_25%,transparent_25%,transparent_75%,#d4d4d8_75%)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]'

export function Swatches({ e, kind, size = 20 }: { e: Engine; kind: 'stroke' | 'fill'; size?: number }) {
  const colours = kind === 'stroke' ? STROKES : FILLS
  const current = kind === 'stroke' ? e.style.stroke : e.style.fill
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={kind === 'stroke' ? 'Stroke colour' : 'Fill'}>
      {colours.map((c) => (
        <button
          key={c}
          role="radio"
          aria-checked={current === c}
          aria-label={c}
          onClick={() => e.applyStyle(kind === 'stroke' ? { strokeColor: c } : { backgroundColor: c })}
          style={{ width: size, height: size, backgroundColor: c === 'transparent' ? undefined : c }}
          className={`rounded-full border border-black/15 dark:border-white/20 outline-offset-2 ${c === 'transparent' ? checker : ''} ${current === c ? 'outline outline-2 outline-indigo-500' : ''}`}
        />
      ))}
    </div>
  )
}

export function Widths({ e }: { e: Engine }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Stroke width">
      {WIDTHS.map((w) => (
        <button
          key={w}
          role="radio"
          aria-checked={e.style.width === w}
          aria-label={`Width ${w}`}
          onClick={() => e.applyStyle({ strokeWidth: w })}
          className={`grid h-7 w-8 place-items-center rounded-md ${e.style.width === w ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <span className="block w-4 rounded-full bg-current" style={{ height: w + 1 }} />
        </button>
      ))}
    </div>
  )
}
