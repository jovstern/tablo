const FIRST_DELAY_MS = 1000
const LONGEST_DELAY_MS = 30_000

/** How long to wait before the nth attempt to reconnect (counting from 1): doubling, up to half a minute. */
export const reconnectDelay = (attempt: number) =>
  Math.min(LONGEST_DELAY_MS, FIRST_DELAY_MS * 2 ** (attempt - 1))
