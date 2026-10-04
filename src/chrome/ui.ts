import type { MouseEvent } from 'react'

/** Shared look of the chrome: floating cards over the canvas (the Dock layout from the spec). */
export const card =
  'pointer-events-auto rounded-2xl border border-black/10 bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/90'

export const iconButton =
  'grid h-9 w-9 place-items-center rounded-xl enabled:hover:bg-black/5 dark:enabled:hover:bg-white/10 disabled:opacity-30'

export const divider = 'h-4 w-px bg-black/10 dark:bg-white/15'

/**
 * For onMouseDown on chrome buttons: a click must not take keyboard focus from
 * the canvas, or Space and Enter would press the button again instead of reaching the canvas.
 */
export const keepCanvasFocus = (event: MouseEvent) => event.preventDefault()
