import { expect, test } from '@playwright/test'
import { drag, openBoard, scene, waitForBoard } from './board'

async function drawRectangle(page: Parameters<typeof drag>[0]) {
  await page.keyboard.press('r')
  await drag(page, [300, 300], [500, 420])
}

test('a board is still there after a reload', async ({ page }) => {
  await openBoard(page, '/')
  await drawRectangle(page)

  await page.reload()
  await waitForBoard(page)

  const elements = await scene(page)
  expect(elements).toHaveLength(1)
  expect(elements[0]).toMatchObject({ type: 'rectangle', width: 200, height: 120 })
})

test('the root URL reopens the recent board', async ({ page }) => {
  await openBoard(page, '/')
  const board = page.url()
  await drawRectangle(page)

  await openBoard(page, '/')

  await expect(page).toHaveURL(board)
  expect(await scene(page)).toHaveLength(1)
})

test('a new board becomes the recent board and leaves the older one saved', async ({ page }) => {
  await openBoard(page, '/')
  const older = page.url()
  await drawRectangle(page)
  await page.getByRole('button', { name: 'New board' }).click()
  await expect(page).not.toHaveURL(older)
  await waitForBoard(page)
  const newer = page.url()

  await openBoard(page, '/')
  await expect(page).toHaveURL(newer)
  expect(await scene(page)).toHaveLength(0)

  await openBoard(page, older)
  expect(await scene(page)).toHaveLength(1)
})

test('a deleted element stays deleted after a reload', async ({ page }) => {
  await openBoard(page, '/')
  await drawRectangle(page)
  await page.keyboard.press('Delete')
  expect(await scene(page)).toHaveLength(0)

  await page.reload()
  await waitForBoard(page)

  expect(await scene(page)).toHaveLength(0)
})
