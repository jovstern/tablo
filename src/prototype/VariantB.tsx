// PROTOTYPE variant B, "Rail": a fixed rail on the left edge holds everything; the canvas starts beside it.
import { Download, FilePlus2, Minus, Moon, Plus, Redo2, Sun, Undo2 } from 'lucide-react'
import { pickTool, Swatches, TOOLS, Widths } from './parts'
import type { Engine } from './useEngine'

export const name = 'Rail'
export const inset = { left: 56 }

const btn = 'grid h-10 w-10 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10'

export function VariantB({ e, dark, toggleDark }: { e: Engine; dark: boolean; toggleDark: () => void }) {
  const showStyle = e.hasSelection || e.tool !== 'selection'
  return (
    <>
      <aside className="absolute inset-y-0 left-0 z-10 flex w-14 flex-col items-center border-r border-black/10 bg-zinc-50 py-3 text-zinc-800 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100">
        <span className="mb-3 grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">t</span>
        <div className="flex flex-col gap-0.5">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              aria-label={t.label}
              title={`${t.label} (${t.keyHint})`}
              aria-pressed={e.tool === t.id}
              onClick={() => pickTool(e, t.id)}
              className={`relative grid h-10 w-10 place-items-center rounded-lg ${e.tool === t.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              {t.icon}
            </button>
          ))}
        </div>
        <span className="my-3 h-px w-6 bg-black/10 dark:bg-white/15" />
        <button className={btn} aria-label="Undo" onClick={e.undo}><Undo2 size={17} /></button>
        <button className={btn} aria-label="Redo" onClick={e.redo}><Redo2 size={17} /></button>
        <div className="mt-auto flex flex-col gap-0.5">
          <button className={btn} aria-label="New board" title="New board"><FilePlus2 size={17} /></button>
          <button className={btn} aria-label="Toggle theme" onClick={toggleDark}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        </div>
      </aside>

      {showStyle && (
        <div className="absolute left-[68px] top-14 z-10 w-52 rounded-xl border border-black/10 bg-white p-3 text-xs text-zinc-500 shadow-lg dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="mb-1.5 font-medium uppercase tracking-wide">Stroke</p>
          <Swatches e={e} kind="stroke" />
          <p className="mb-1.5 mt-3 font-medium uppercase tracking-wide">Fill</p>
          <Swatches e={e} kind="fill" />
          <p className="mb-1.5 mt-3 font-medium uppercase tracking-wide">Width</p>
          <div className="text-zinc-800 dark:text-zinc-100"><Widths e={e} /></div>
        </div>
      )}

      <div className="absolute right-3 top-3 z-10 flex items-center rounded-lg border border-black/10 bg-white text-sm text-zinc-800 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
        <button className="grid h-9 w-9 place-items-center" aria-label="Zoom out" onClick={e.zoomOut}><Minus size={15} /></button>
        <button className="w-12 text-center tabular-nums" onClick={e.zoomReset}>{Math.round(e.zoom * 100)}%</button>
        <button className="grid h-9 w-9 place-items-center" aria-label="Zoom in" onClick={e.zoomIn}><Plus size={15} /></button>
        <span className="h-5 w-px bg-black/10 dark:bg-white/15" />
        <button className="flex h-9 items-center gap-1.5 px-3" onClick={e.exportPng}><Download size={15} /> PNG</button>
        <button className="h-9 pr-3" onClick={e.exportSvg}>SVG</button>
      </div>
    </>
  )
}
