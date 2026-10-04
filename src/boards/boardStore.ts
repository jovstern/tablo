import type { Scene } from '../engine/engine'

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' }

/**
 * Where boards are saved and loaded from (ADR 0002). Everything that persists a
 * board goes through this, so the storage behind it can change.
 */
export interface BoardStore {
  /** The saved scene of a board, or null if this store has never saved it. */
  load(id: string): Scene | null
  /** Saves a board's scene. Failure is a value: a full quota is expected, not exceptional. */
  save(id: string, scene: Scene): SaveResult
  /** The board opened last, or null if none has been. */
  recentBoard(): string | null
  setRecentBoard(id: string): void
}
