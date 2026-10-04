import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, scene, tool, twoParticipants, waitForBoard } from './board'

/** The name this page's visitor goes by. */
const nameOf = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tablo:identity')!).name as string)

/** The other participants this page's canvas is showing. */
const shown = (page: Page) => page.evaluate(() => window.__tablo!.shownParticipants())

test("a participant's cursor shows on the other's board with their name", async ({
  page,
  browser,
}) => {
  const [ana, ben] = await twoParticipants(page, browser)

  await ana.mouse.move(400, 300)

  await expect
    .poll(() => shown(ben))
    .toMatchObject([{ name: await nameOf(ana), pointer: { x: 400, y: 300 } }])
})

test("a participant's cursor follows their pointer", async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await ana.mouse.move(400, 300)
  await expect.poll(() => shown(ben)).toMatchObject([{ pointer: { x: 400, y: 300 } }])

  await ana.mouse.move(650, 420, { steps: 5 })

  await expect.poll(() => shown(ben)).toMatchObject([{ pointer: { x: 650, y: 420 } }])
})

test('a participant is shown by name before they move', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)

  await expect.poll(() => shown(ben)).toMatchObject([{ name: await nameOf(ana) }])
  await expect.poll(() => shown(ana)).toMatchObject([{ name: await nameOf(ben) }])
})

test("what a participant has selected is shown on the other's board", async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)

  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)
  const [rectangle] = await scene(ana)

  await expect.poll(() => shown(ben)).toMatchObject([{ selectedIds: [rectangle.id] }])

  // Ana clicks an empty part of the canvas to deselect.
  await ana.mouse.click(900, 150)
  await expect.poll(() => shown(ben)).toMatchObject([{ selectedIds: [] }])
})

test("a participant's cursor goes when they leave", async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await ana.mouse.move(400, 300)
  await expect.poll(() => shown(ben)).toHaveLength(1)

  await ana.goto('about:blank')

  await expect.poll(() => shown(ben)).toEqual([])
})

test('participants have a colour from their identity', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  const colour = await ana.evaluate(
    () => JSON.parse(localStorage.getItem('tablo:identity')!).colour as string,
  )

  await expect.poll(() => shown(ben)).toMatchObject([{ colour }])
})

test('a visitor keeps their name across reloads and boards', async ({ page }) => {
  await openBoard(page, '/')
  const name = await nameOf(page)

  await page.reload()
  await waitForBoard(page)
  expect(await nameOf(page)).toBe(name)

  await page.getByRole('button', { name: 'New board' }).click()
  await waitForBoard(page)
  expect(await nameOf(page)).toBe(name)
})
