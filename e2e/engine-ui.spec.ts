import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, scene } from './board'

async function drawRectangle(page: Page) {
  await page.keyboard.press('r')
  await drag(page, [200, 300], [300, 380])
}

/** Drops an image file on the canvas. */
const dropImage = (page: Page) =>
  page.evaluate(async () => {
    const png = await (
      await fetch(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      )
    ).blob()
    const data = new DataTransfer()
    data.items.add(new File([png], 'pixel.png', { type: 'image/png' }))
    const canvas = document.querySelector('canvas.interactive')!
    const init = { dataTransfer: data, bubbles: true, cancelable: true, clientX: 400, clientY: 300 }
    canvas.dispatchEvent(new DragEvent('dragover', init))
    canvas.dispatchEvent(new DragEvent('drop', init))
  })

test("right-clicking the canvas does not open the engine's menu", async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page)

  await page.mouse.click(250, 340, { button: 'right' })

  await expect(page.getByText('Zen mode')).toBeHidden()
  await expect(page.getByText('Paste', { exact: true })).toBeHidden()
})

for (const [name, keys] of [
  ['help', 'Shift+?'],
  ['command palette', 'ControlOrMeta+/'],
  ['image export', 'ControlOrMeta+Shift+e'],
] as const) {
  test(`the shortcut for the engine's ${name} dialog opens nothing`, async ({ page }) => {
    await openBoard(page)

    await page.keyboard.press(keys)

    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}

test("the engine's view mode cannot lock the board", async ({ page }) => {
  await openBoard(page)

  await page.keyboard.press('Alt+r')
  await drawRectangle(page)

  expect(await scene(page)).toHaveLength(1)
})

test('an image dropped on the canvas is not added to the board', async ({ page }) => {
  await openBoard(page)

  await dropImage(page)
  await page.waitForTimeout(500)

  expect(await scene(page)).toHaveLength(0)
})

test.describe('in a narrow window', () => {
  test.use({ viewport: { width: 700, height: 800 } })

  test("none of the engine's own controls are offered", async ({ page }) => {
    await openBoard(page)
    await drawRectangle(page)

    for (const name of ['Edit', 'Duplicate', 'Delete']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
    }
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(1)
  })

  test('undo and redo work', async ({ page }) => {
    await openBoard(page)
    await drawRectangle(page)

    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    expect(await scene(page)).toHaveLength(0)

    await page.getByRole('button', { name: 'Redo', exact: true }).click()
    expect(await scene(page)).toHaveLength(1)
  })

  test('zoom works', async ({ page }) => {
    await openBoard(page)

    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Reset zoom' })).toHaveText('110%')

    await page.getByRole('button', { name: 'Reset zoom' }).click()
    await expect(page.getByRole('button', { name: 'Reset zoom' })).toHaveText('100%')
  })
})
