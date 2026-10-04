/** A fresh board id: 128 random bits as 22 URL-safe characters, so it cannot be guessed. */
export function newBoardId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

export const boardPath = (id: string) => `/b/${id}`
