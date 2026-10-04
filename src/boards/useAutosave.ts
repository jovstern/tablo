import { useEffect } from 'react'
import type { Engine, Scene } from '../engine/engine'
import type { BoardStore } from './boardStore'
import { debounce } from './debounce'

const SAVE_DELAY_MS = 400

/** Saves the board shortly after each scene change, and at once when the page or board goes away. */
export function useAutosave(engine: Engine | null, id: string, store: BoardStore) {
  useEffect(() => {
    if (!engine) return
    const save = debounce((scene: Scene) => void store.save(id, scene), SAVE_DELAY_MS)
    // Capture the scene when it changes: by the time a flush runs on the way out,
    // the engine may already be torn down and report an empty canvas.
    const unsubscribe = engine.onSceneChange(() => save({ elements: engine.scene() }))
    window.addEventListener('pagehide', save.flush)
    return () => {
      unsubscribe()
      window.removeEventListener('pagehide', save.flush)
      save.flush()
    }
  }, [engine, id, store])
}
