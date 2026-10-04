// PROTOTYPE variant A, "Dock": everything floats; the canvas owns the whole window.
import { Download, Minus, Moon, Plus, Redo2, Sun, Undo2 } from 'lucide-react'
import { pickTool, Swatches, TOOLS, Widths } from './parts'
import type { Engine } from './useEngine'

export const name = 'Dock'

const card =
  'pointer-events-auto rounded-2xl border border-black/10 bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/90'
const btn = 'grid h-9 w-9 place-items-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10'

export function VariantA({ e, dark, toggleDark }: { e: Engine; dark: boolean; toggleDark: () => void }) {
  const showStyle = e.hasSelection || e.tool !== 'selection'
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-zinc-800 dark:text-zinc-100">
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <div className={`${card} flex h-11 items-center gap-3 px-4`}>
          <span className="text-[15px] font-semibold tracking-tight">tablo</span>
          <span className="h-4 w-px bg-black/10 dark:bg-white/15" />
          <button className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">New board</button>
        </div>
      </div>

      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className={`${card} flex h-11 items-center gap-1 px-1.5`}>
          <button className="flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={e.exportPng}>
            <Download size={15} /> PNG
          </button>
          <button className="flex h-8 items-center rounded-xl px-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={e.exportSvg}>
            SVG
          </button>
          <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/15" />
          <button className={btn} aria-label="Toggle theme" onClick={toggleDark}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className={`${card} flex h-11 items-center px-1.5`}>
          <button className={btn} aria-label="Zoom out" onClick={e.zoomOut}><Minus size={16} /></button>
          <button className="w-14 text-center text-sm tabular-nums" onClick={e.zoomReset}>{Math.round(e.zoom * 100)}%</button>
          <button className={btn} aria-label="Zoom in" onClick={e.zoomIn}><Plus size={16} /></button>
        </div>
        <div className={`${card} flex h-11 items-center px-1.5`}>
          <button className={btn} aria-label="Undo" onClick={e.undo}><Undo2 size={16} /></button>
          <button className={btn} aria-label="Redo" onClick={e.redo}><Redo2 size={16} /></button>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        {showStyle && (
          <div className={`${card} flex items-center gap-4 px-4 py-2.5`}>
            <Swatches e={e} kind="stroke" />
            <span className="h-5 w-px bg-black/10 dark:bg-white/15" />
            <Swatches e={e} kind="fill" />
            <span className="h-5 w-px bg-black/10 dark:bg-white/15" />
            <Widths e={e} />
          </div>
        )}
        <div className={`${card} flex items-center gap-1 p-1.5`}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              aria-label={t.label}
              title={`${t.label} (${t.keyHint})`}
              aria-pressed={e.tool === t.id}
              onClick={() => pickTool(e, t.id)}
              className={`grid h-10 w-10 place-items-center rounded-xl ${e.tool === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
