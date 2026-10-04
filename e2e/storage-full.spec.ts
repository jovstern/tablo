import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, scene, waitForBoard } from './board'

const warning = (page: Page) => page.getByRole('alert')

/** Fills what is left of this origin's storage, to the last character. */
const fillStorage = (page: Page) =>
  page.evaluate(() => {
    let filler = ''
    for (let size = 8 * 1024 * 1024; size >= 1; size = Math.floor(size / 2)) {
      try {
        localStorage.setItem('filler', filler + 'x'.repeat(size))
        filler += 'x'.repeat(size)
      } catch {
        // Too big to fit; try half as much.
      }
    }
  })

async function drawRectangle(page: Page, from: [number, number]) {
  await page.keyboard.press('r')
  await drag(page, from, [from[0] + 100, from[1] + 80])
}

test('there is no warning while saving works', async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page, [300, 300])

  await page.waitForTimeout(800)
  await expect(warning(page)).toHaveCount(0)
})

test('a full storage warns that the board is no longer being saved', async ({ page }) => {
  await openBoard(page)
  await fillStorage(page)

  await drawRectangle(page, [300, 300])

  await expect(warning(page)).toContainText('no longer being saved')
})

test('the warning offers export', async ({ page }) => {
  await openBoard(page)
  await fillStorage(page)
  await drawRectangle(page, [300, 300])

  const [png] = await Promise.all([
    page.waitForEvent('download'),
    warning(page).getByRole('button', { name: 'Export PNG' }).click(),
  ])
  const [svg] = await Promise.all([
    page.waitForEvent('download'),
    warning(page).getByRole('button', { name: 'Export SVG' }).click(),
  ])

  expect(png.suggestedFilename()).toBe('tablo.png')
  expect(svg.suggestedFilename()).toBe('tablo.svg')
})

test('the warning clears once a later save succeeds, and the board is saved', async ({ page }) => {
  await openBoard(page)
  await fillStorage(page)
  await drawRectangle(page, [300, 300])
  await expect(warning(page)).toBeVisible()

  await page.evaluate(() => localStorage.removeItem('filler'))
  await drawRectangle(page, [500, 300])

  await expect(warning(page)).toHaveCount(0)
  await page.reload()
  await waitForBoard(page)
  expect(await scene(page)).toHaveLength(2)
})

test('a full storage does not cost an older board its saved scene', async ({ page }) => {
  await openBoard(page)
  const older = page.url()
  await drawRectangle(page, [300, 300])
  await page.getByRole('button', { name: 'New board' }).click()
  await expect(page).not.toHaveURL(older)
  await waitForBoard(page)
  await fillStorage(page)

  await drawRectangle(page, [300, 300])
  await expect(warning(page)).toBeVisible()

  await page.evaluate(() => localStorage.removeItem('filler'))
  await openBoard(page, older)
  expect(await scene(page)).toHaveLength(1)
})
