import { useCallback, useEffect } from 'react'
import { Chrome } from './chrome/Chrome'
import type { Engine } from './engine/engine'
import { EngineCanvas } from './engine/EngineCanvas'

/** One board: its canvas and the chrome around it. */
export function Board({ id }: { id: string }) {
  const handleReady = useCallback(
    (engine: Engine) => {
      if (import.meta.env.DEV) window.__tablo = { boardId: id, scene: () => [...engine.scene()] }
    },
    [id],
  )
  useEffect(() => () => void delete window.__tablo, [])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <EngineCanvas onReady={handleReady} />
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
