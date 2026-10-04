import { TriangleAlert } from 'lucide-react'
import type { SaveFailure } from '../boards/useAutosave'
import type { Engine } from '../engine/engine'
import { ExportButtons } from './ExportButtons'

const REASONS: Record<SaveFailure, string> = {
  quota: "This browser's storage is full.",
  unavailable: "This browser's storage is not available.",
}

/** Top centre: says that saving has stopped and offers export as the way out. Stays until a save succeeds. */
export function SaveWarning({ failure, engine }: { failure: SaveFailure; engine: Engine }) {
  return (
    <div
      role="alert"
      className="pointer-events-auto absolute left-1/2 top-4 flex h-11 -translate-x-1/2 items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-50 pl-4 pr-1.5 text-sm text-amber-950 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-amber-950 dark:text-amber-100"
    >
      <TriangleAlert size={16} className="shrink-0" />
      <span className="whitespace-nowrap">
        {REASONS[failure]} This board is no longer being saved.
      </span>
      <ExportButtons engine={engine} />
    </div>
  )
}
