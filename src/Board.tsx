import { useEffect, useState } from 'react'
import type { BoardStore } from './boards/boardStore'
import { useAutosave } from './boards/useAutosave'
import { Chrome } from './chrome/Chrome'
import type { Engine } from './engine/engine'
import { EngineCanvas } from './engine/EngineCanvas'

/** One board: its canvas and the chrome around it. */
export function Board({ id, store }: { id: string; store: BoardStore }) {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [savedScene] = useState(() => store.load(id))

  useEffect(() => store.setRecentBoard(id), [id, store])
  useAutosave(engine, id, store)

  useEffect(() => {
    if (!import.meta.env.DEV || !engine) return
    window.__tablo = { boardId: id, scene: () => [...engine.scene()] }
    return () => void delete window.__tablo
  }, [engine, id])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <EngineCanvas initialScene={savedScene} onReady={setEngine} />
      <Chrome />
    </div>
  )
}

declare global {
  interface Window {
    /** Dev-only hook that lets browser tests read the scene. */
    __tablo?: { boardId: string; scene(): unknown[] }
  }
}
