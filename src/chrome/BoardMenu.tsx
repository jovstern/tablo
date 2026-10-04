import { useNavigate } from 'react-router'
import { boardPath, newBoardId } from '../boards/boardId'
import { card, divider, keepCanvasFocus } from './ui'

/** Top left: the wordmark and the way to a fresh board. */
export function BoardMenu() {
  const navigate = useNavigate()
  return (
    <div className={`${card} absolute left-4 top-4 flex h-11 items-center gap-3 px-4`}>
      <span className="text-[15px] font-semibold tracking-tight">tablo</span>
      <span className={divider} />
      <button
        type="button"
        onMouseDown={keepCanvasFocus}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        onClick={() => navigate(boardPath(newBoardId()))}
      >
        New board
      </button>
    </div>
  )
}
