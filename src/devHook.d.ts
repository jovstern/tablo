export {}

declare global {
  interface Window {
    /** Dev-only hook that lets browser tests read the scene of the board on screen. */
    __tablo?: { boardId: string; scene(): unknown[] }
  }
}
