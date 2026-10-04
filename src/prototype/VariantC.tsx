// PROTOTYPE variant C, "Bar": one slim bar across the top holds tools, style and actions inline. Nothing floats.
import { Minus, Moon, Plus, Redo2, Sun, Undo2 } from 'lucide-react'
import { pickTool, Swatches, TOOLS, Widths } from './parts'
import type { Engine } from './useEngine'

export const name = 'Bar'
export const inset = { top: 48 }

const btn = 'grid h-8 w-8 place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/10'
const sep = <span className="mx-2 h-5 w-px shrink-0 bg-black/10 dark:bg-white/15" />

export function VariantC({ e, dark, toggleDark }: { e: Engine; dark: boolean; toggleDark: () => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-10 flex h-12 items-center border-b border-black/10 bg-white px-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100">
      <span className="mr-3 font-semibold tracking-tight">tablo</span>
      <div className="flex items-center">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            aria-label={t.label}
            title={`${t.label} (${t.keyHint})`}
            aria-pressed={e.tool === t.id}
            onClick={() => pickTool(e, t.id)}
            className={`grid h-12 w-10 place-items-center border-b-2 ${e.tool === t.id ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/10'}`}
          >
            {t.icon}
          </button>
        ))}
      </div>
      {sep}
      <Swatches e={e} kind="stroke" size={16} />
      {sep}
      <Swatches e={e} kind="fill" size={16} />
      {sep}
      <Widths e={e} />
      <div className="ml-auto flex items-center">
        <button className={btn} aria-label="Undo" onClick={e.undo}><Undo2 size={16} /></button>
        <button className={btn} aria-label="Redo" onClick={e.redo}><Redo2 size={16} /></button>
        {sep}
        <button className={btn} aria-label="Zoom out" onClick={e.zoomOut}><Minus size={15} /></button>
        <button className="w-12 text-center tabular-nums" onClick={e.zoomReset}>{Math.round(e.zoom * 100)}%</button>
        <button className={btn} aria-label="Zoom in" onClick={e.zoomIn}><Plus size={15} /></button>
        {sep}
        <button className="h-8 rounded-md px-2 hover:bg-black/5 dark:hover:bg-white/10" onClick={e.exportPng}>PNG</button>
        <button className="h-8 rounded-md px-2 hover:bg-black/5 dark:hover:bg-white/10" onClick={e.exportSvg}>SVG</button>
        {sep}
        <button className="h-8 rounded-md px-2 hover:bg-black/5 dark:hover:bg-white/10">New board</button>
        <button className={btn} aria-label="Toggle theme" onClick={toggleDark}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
      </div>
    </header>
  )
}
