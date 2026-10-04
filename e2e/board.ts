import type { Page } from '@playwright/test'

/** What browser tests may know about an element on the canvas. */
export type SceneElement = {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  strokeColor: string
  backgroundColor: string
  strokeWidth: number
  roughness: number
  text?: string
  containerId?: string | null
}

/** Opens a URL and waits until the board's canvas is ready for input. */
export async function openBoard(page: Page, url = '/') {
  await page.goto(url)
  await waitForBoard(page)
}

/** Waits until the board at the current URL is ready for input. */
export async function waitForBoard(page: Page) {
  // Compare against the live URL: the root URL redirects on the client after load.
  await page.waitForFunction(
    () => window.__tablo !== undefined && location.pathname === `/b/${window.__tablo.boardId}`,
  )
}

/** The scene as the engine currently holds it. */
export function scene(page: Page): Promise<SceneElement[]> {
  return page.evaluate(() => window.__tablo!.scene() as unknown as SceneElement[])
}

/** Drags on the canvas between two viewport points. */
export async function drag(page: Page, from: [number, number], to: [number, number]) {
  await page.mouse.move(...from)
  await page.mouse.down()
  await page.mouse.move(...to, { steps: 5 })
  await page.mouse.up()
}

declare global {
  interface Window {
    __tablo?: { boardId: string; scene(): unknown[] }
  }
}
