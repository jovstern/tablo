import { useCallback, useLayoutEffect, useState } from 'react'
import type { Theme } from '../engine/engine'

const THEME_KEY = 'tablo:theme'

/** A stored choice wins; without one the theme follows the system setting. */
function initialTheme(storage: Storage): Theme {
  try {
    const stored = storage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage is unavailable: fall through to the system setting.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** The theme of the whole app, and a toggle that also remembers the choice in this browser. */
export function useTheme(storage: Storage): [Theme, () => void] {
  const [theme, setTheme] = useState(() => initialTheme(storage))

  // Before paint, so a dark board never flashes light chrome on load.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      storage.setItem(THEME_KEY, next)
    } catch {
      // The theme still switches; it just will not be remembered.
    }
  }, [storage, theme])

  return [theme, toggle]
}
