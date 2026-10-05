import { newBoardId } from './boardId'
import type { BoardStore } from './boardStore'

/**
 * The board the root URL leads to: the recent board, or a new one if none was
 * opened before. Only a new one is known to be the visitor's own; the recent
 * board may be a link someone sent them.
 */
export function homeBoard(store: BoardStore): { id: string; isNew: boolean } {
  const recent = store.recentBoard()
  return recent === null ? { id: newBoardId(), isNew: true } : { id: recent, isNew: false }
}
