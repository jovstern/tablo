export type Debounced<A extends unknown[]> = ((...args: A) => void) & {
  /** Runs a pending call at once. */
  flush(): void
}

/** Delays `run` until calls have stopped for `wait` ms; only the last call's arguments are used. */
export function debounce<A extends unknown[]>(
  run: (...args: A) => void,
  wait: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: A | undefined

  const flush = () => {
    clearTimeout(timer)
    if (!pending) return
    const args = pending
    pending = undefined
    run(...args)
  }

  return Object.assign(
    (...args: A) => {
      pending = args
      clearTimeout(timer)
      timer = setTimeout(flush, wait)
    },
    { flush },
  )
}
