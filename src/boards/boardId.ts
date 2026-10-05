/** A fresh board id: 128 random bits as 22 URL-safe characters, so it cannot be guessed. */
export function newBoardId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

export const boardPath = (id: string) => `/b/${id}`

/**
 * Navigation state for a board this visitor reached through tablo itself (the root
 * URL or "New board"), as opposed to a link someone sent them. The browser keeps
 * it with the history entry, so it survives a reload.
 */
export const OWN_BOARD = 'own-board'
