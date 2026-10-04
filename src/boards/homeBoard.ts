import { newBoardId } from './boardId'
import type { BoardStore } from './boardStore'

/** The board the root URL leads to: the recent board, or a new one if none was opened before. */
export const homeBoardId = (store: BoardStore) => store.recentBoard() ?? newBoardId()
