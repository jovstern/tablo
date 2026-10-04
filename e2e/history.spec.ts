import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, scene } from './board'

const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true })
const redo = (page: Page) => page.getByRole('button', { name: 'Redo', exact: true })

async function drawRectangle(page: Page) {
  await page.keyboard.press('r')
  await drag(page, [300, 300], [500, 420])
}

test('there is nothing to undo or redo on a fresh board', async ({ page }) => {
  await openBoard(page)

  await expect(undo(page)).toBeDisabled()
  await expect(redo(page)).toBeDisabled()
})

test('undo removes the last change and redo restores it', async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page)

  await undo(page).click()
  expect(await scene(page)).toHaveLength(0)

  await redo(page).click()
  expect(await scene(page)).toMatchObject([{ type: 'rectangle' }])
})

test('undo and redo are enabled only when they would do something', async ({ page }) => {
  await openBoard(page)

  await drawRectangle(page)
  await expect(undo(page)).toBeEnabled()
  await expect(redo(page)).toBeDisabled()

  await undo(page).click()
  await expect(undo(page)).toBeDisabled()
  await expect(redo(page)).toBeEnabled()

  await redo(page).click()
  await expect(undo(page)).toBeEnabled()
  await expect(redo(page)).toBeDisabled()
})

test('the buttons follow undo and redo done from the keyboard', async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page)

  await page.keyboard.press('ControlOrMeta+z')
  expect(await scene(page)).toHaveLength(0)
  await expect(undo(page)).toBeDisabled()
  await expect(redo(page)).toBeEnabled()

  await page.keyboard.press('ControlOrMeta+Shift+z')
  expect(await scene(page)).toHaveLength(1)
  await expect(redo(page)).toBeDisabled()
})
