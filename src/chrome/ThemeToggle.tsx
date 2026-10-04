import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../engine/engine'
import { iconButton, keepCanvasFocus } from './ui'

/** Switches between the light and dark theme. Pressed while dark. */
export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      aria-label="Dark theme"
      aria-pressed={dark}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onMouseDown={keepCanvasFocus}
      onClick={onToggle}
      className={iconButton}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
