import type { Browser, Page } from '@playwright/test'

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

/** A button in the tool bar. */
export const tool = (page: Page, name: string) =>
  page.getByRole('toolbar', { name: 'Tools' }).getByRole('button', { name, exact: true })

/** Drags on the canvas between two viewport points. */
export async function drag(page: Page, from: [number, number], to: [number, number]) {
  await page.mouse.move(...from)
  await page.mouse.down()
  await page.mouse.move(...to, { steps: 5 })
  await page.mouse.up()
}

/** How many other participants this page's board currently sees. */
export const otherParticipants = (page: Page) =>
  page.evaluate(() => window.__tablo!.otherParticipants())

/** Another visitor, in a browser of their own with its own storage, opening a board link. */
export async function openParticipant(browser: Browser, url: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage()
  await openBoard(page, url)
  return page
}

/**
 * Two participants on one board, each in a browser of their own, both connected
 * and aware of each other. The first uses the given page and creates the board.
 */
export async function twoParticipants(page: Page, browser: Browser): Promise<[Page, Page]> {
  await openBoard(page, '/')
  const second = await openParticipant(browser, page.url())
  for (const participant of [page, second]) {
    await participant.waitForFunction(() => window.__tablo!.otherParticipants() === 1)
  }
  return [page, second]
}

/** The name this page's visitor goes by. */
export const nameOf = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tablo:identity')!).name as string)
