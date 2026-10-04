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
}

/** Opens a URL and waits until the board's canvas is ready for input. */
export async function openBoard(page: Page, url = '/') {
  await page.goto(url)
  await waitForBoard(page)
}

/** Waits until the board at the current URL is ready for input. */
export async function waitForBoard(page: Page) {
  await page.waitForFunction(
    (path) => window.__tablo !== undefined && window.__tablo.boardId === path.split('/b/')[1],
    new URL(page.url()).pathname,
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
