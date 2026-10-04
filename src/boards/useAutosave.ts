import { useEffect, useState } from 'react'
import type { Engine, Scene } from '../engine/engine'
import type { BoardStore, SaveResult } from './boardStore'
import { debounce } from './debounce'

const SAVE_DELAY_MS = 400

export type SaveFailure = Extract<SaveResult, { ok: false }>['reason']

/**
 * Saves the board shortly after each scene change, and at once when the page or
 * board goes away. Returns why the last save failed, or null while saving works;
 * every later change tries again.
 */
export function useAutosave(engine: Engine | null, id: string, store: BoardStore) {
  const [failure, setFailure] = useState<SaveFailure | null>(null)

  useEffect(() => {
    if (!engine) return
    const save = debounce((scene: Scene) => {
      const result = store.save(id, scene)
      setFailure(result.ok ? null : result.reason)
    }, SAVE_DELAY_MS)
    // Capture the scene when it changes: by the time a flush runs on the way out,
    // the engine may already be torn down and report an empty canvas.
    // Saved with its tombstones, so a deletion outlives a reload and still
    // reaches a browser that returns later with the element (ADR 0003).
    const unsubscribe = engine.onSceneChange(() => save(engine.sceneWithTombstones()))
    window.addEventListener('pagehide', save.flush)
    return () => {
      unsubscribe()
      window.removeEventListener('pagehide', save.flush)
      save.flush()
    }
  }, [engine, id, store])

  return failure
}
