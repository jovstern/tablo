import { expect, test, type Page } from '@playwright/test'
import { drag, nameOf, openBoard, scene, tool, twoParticipants, waitForBoard } from './board'

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

test("a participant's cursor has the colour of their avatar", async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await ana.mouse.move(400, 300)
  await expect.poll(() => shown(ben)).toMatchObject([{ pointer: { x: 400, y: 300 } }])
  // Give the canvas a frame to draw the cursor.
  await ben.waitForTimeout(300)

  const colours = await ben.evaluate(() => {
    const rgb = (text: string) => text.match(/\d+/g)!.slice(0, 3).map(Number)
    // The second avatar is the other participant's.
    const avatar = document.querySelectorAll('[data-avatar-colour]')[1]
    // The cursor's arrow is drawn down and to the right of the pointer: count the
    // opaque pixels there and take the commonest colour that is not the white outline.
    const canvas = document.querySelector<HTMLCanvasElement>('canvas.interactive')!
    const context = canvas.getContext('2d')!
    const counts = new Map<string, number>()
    for (let dx = 0; dx < 14; dx++) {
      for (let dy = 0; dy < 14; dy++) {
        const [r, g, b, a] = context.getImageData(
          (400 + dx) * devicePixelRatio,
          (300 + dy) * devicePixelRatio,
          1,
          1,
        ).data
        if (a === 255 && r + g + b < 765)
          counts.set(`${r},${g},${b}`, (counts.get(`${r},${g},${b}`) ?? 0) + 1)
      }
    }
    const [cursor] = [...counts].sort((a, b) => b[1] - a[1])[0]
    return { avatar: rgb(getComputedStyle(avatar).backgroundColor), cursor: rgb(cursor) }
  })

  for (const channel of [0, 1, 2]) {
    expect(Math.abs(colours.cursor[channel] - colours.avatar[channel])).toBeLessThanOrEqual(2)
  }
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
