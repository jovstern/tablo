import { useCallback } from 'react'
import type { Engine } from './engine/engine'
import { EngineCanvas } from './engine/EngineCanvas'

export function Board() {
  const handleReady = useCallback((engine: Engine) => {
    if (import.meta.env.DEV) window.__tablo = { scene: () => [...engine.scene()] }
  }, [])

  return (
    <div className="h-full w-full">
      <EngineCanvas onReady={handleReady} />
    </div>
  )
}

declare global {
  interface Window {
    /** Dev-only hook that lets browser tests read the scene. */
    __tablo?: { scene(): unknown[] }
  }
}
