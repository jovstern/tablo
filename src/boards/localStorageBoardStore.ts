import type { Scene } from '../engine/engine'
import type { BoardStore, SaveResult } from './boardStore'

const RECENT_KEY = 'tablo:recent'
const boardKey = (id: string) => `tablo:board:${id}`

const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')

/** A board store on Web Storage: one entry per board, plus one for the recent board. */
export function localStorageBoardStore(storage: Storage): BoardStore {
  return {
    load(id) {
      try {
        const stored = storage.getItem(boardKey(id))
        return stored === null ? null : (JSON.parse(stored) as Scene)
      } catch {
        return null
      }
    },

    save(id, scene): SaveResult {
      try {
        // setItem replaces the entry only if the new value fits, so a failed save loses nothing.
        storage.setItem(boardKey(id), JSON.stringify(scene))
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: isQuotaError(error) ? 'quota' : 'unavailable' }
      }
    },

    recentBoard() {
      try {
        return storage.getItem(RECENT_KEY)
      } catch {
        return null
      }
    },

    setRecentBoard(id) {
      try {
        storage.setItem(RECENT_KEY, id)
      } catch {
        // Not remembering the recent board is harmless; the board itself still works.
      }
    },
  }
}
