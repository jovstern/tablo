/**
 * Runs `run` at most once per `wait` ms: at once if it has been quiet, otherwise
 * once at the end of the wait, so the last call is never lost.
 */
export function throttle(run: () => void, wait: number): (() => void) & { cancel(): void } {
  let last = -Infinity
  let timer: ReturnType<typeof setTimeout> | undefined

  const fire = () => {
    timer = undefined
    last = Date.now()
    run()
  }

  return Object.assign(
    () => {
      if (timer !== undefined) return
      const due = last + wait - Date.now()
      if (due <= 0) fire()
      else timer = setTimeout(fire, due)
    },
    { cancel: () => clearTimeout(timer) },
  )
}
