import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, scene } from './board'

const zoomIn = (page: Page) => page.getByRole('button', { name: 'Zoom in', exact: true })
const zoomOut = (page: Page) => page.getByRole('button', { name: 'Zoom out', exact: true })
const level = (page: Page) => page.getByRole('button', { name: 'Reset zoom', exact: true })

/** Draws a rectangle with the given viewport box and returns it as the scene holds it. */
async function drawRectangle(page: Page, from: [number, number], to: [number, number]) {
  await page.keyboard.press('r')
  await drag(page, from, to)
  return (await scene(page)).at(-1)!
}

test('a board starts at 100%', async ({ page }) => {
  await openBoard(page)

  await expect(level(page)).toHaveText('100%')
})

test('zoom in and zoom out change the zoom level', async ({ page }) => {
  await openBoard(page)

  await zoomIn(page).click()
  await expect(level(page)).toHaveText('110%')

  await zoomOut(page).click()
  await zoomOut(page).click()
  await expect(level(page)).toHaveText('90%')
})

test('zooming in makes the same drag draw a smaller element', async ({ page }) => {
  await openBoard(page)
  await zoomIn(page).click()
  await zoomIn(page).click()
  await expect(level(page)).toHaveText('120%')

  const rectangle = await drawRectangle(page, [300, 300], [540, 420])

  expect(rectangle.width).toBeCloseTo(200, 0)
  expect(rectangle.height).toBeCloseTo(100, 0)
})

test('zooming keeps the centre of the view fixed', async ({ page }) => {
  await openBoard(page)
  const { width, height } = page.viewportSize()!
  const centre: [number, number] = [width / 2, height / 2]
  const before = await drawRectangle(page, centre, [centre[0] + 100, centre[1] + 100])

  await zoomIn(page).click()
  await zoomIn(page).click()
  await zoomIn(page).click()

  // A rectangle started at the centre of the view still starts where the first one did.
  const after = await drawRectangle(page, centre, [centre[0] + 100, centre[1] + 100])
  expect(after.x).toBeCloseTo(before.x, 0)
  expect(after.y).toBeCloseTo(before.y, 0)
})

test('clicking the zoom level resets it to 100%', async ({ page }) => {
  await openBoard(page)
  await zoomIn(page).click()
  await zoomIn(page).click()

  await level(page).click()

  await expect(level(page)).toHaveText('100%')
})

test('the zoom level follows zooming done with the wheel', async ({ page }) => {
  await openBoard(page)
  await page.mouse.move(400, 300)

  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -200)
  await page.keyboard.up('Control')

  await expect(level(page)).not.toHaveText('100%')
})
