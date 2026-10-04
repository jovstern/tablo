import { expect, test } from '@playwright/test'
import { drag, openBoard, scene } from './board'

test('a visitor can draw a rectangle with the keyboard shortcut', async ({ page }) => {
  await openBoard(page)

  await page.keyboard.press('r')
  await drag(page, [300, 300], [500, 420])

  const elements = await scene(page)
  expect(elements).toHaveLength(1)
  expect(elements[0]).toMatchObject({ type: 'rectangle', width: 200, height: 120 })
})

test('elements are drawn with clean strokes', async ({ page }) => {
  await openBoard(page)

  await page.keyboard.press('r')
  await drag(page, [300, 300], [500, 420])

  expect((await scene(page))[0].roughness).toBe(0)
})

test("none of the engine's own controls are offered", async ({ page }) => {
  await openBoard(page)

  for (const name of ['Help', 'Library', 'Insert image']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
  }
  // Controls tablo also offers appear once: its own, not the engine's as well.
  for (const name of ['Undo', 'Redo']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(1)
  }
  await expect(page.getByRole('radio')).toHaveCount(0)
  await expect(page.getByText('Drawings are saved in your browser')).toHaveCount(0)
})

test('the image tool is switched off', async ({ page }) => {
  await openBoard(page)

  await page.keyboard.press('9')
  await drag(page, [300, 300], [500, 420])

  expect(await scene(page)).toHaveLength(0)
})
