import { X } from 'lucide-react'
import { card, iconButton, keepCanvasFocus } from './ui'

/** Says that a shared link opened with nobody there may not show the whole board. */
export function IncompleteNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="status"
      className={`${card} flex h-11 items-center gap-1 pl-4 pr-1.5 text-sm text-zinc-600 dark:text-zinc-300`}
    >
      <span className="whitespace-nowrap">
        Nobody else is here, so this board may be incomplete.
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        title="Dismiss"
        onMouseDown={keepCanvasFocus}
        onClick={onDismiss}
        className={iconButton}
      >
        <X size={15} />
      </button>
    </div>
  )
}
