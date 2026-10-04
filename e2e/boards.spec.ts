import { expect, test } from '@playwright/test'
import { drag, openBoard, scene, waitForBoard } from './board'

const BOARD_URL = /\/b\/[A-Za-z0-9_-]{22}$/

test('the root URL lands on a board with its own URL', async ({ page }) => {
  await openBoard(page, '/')

  await expect(page).toHaveURL(BOARD_URL)
})

test('"New board" opens an empty board at a different URL', async ({ page }) => {
  await openBoard(page, '/')
  const first = page.url()
  await page.keyboard.press('r')
  await drag(page, [300, 300], [500, 420])
  expect(await scene(page)).toHaveLength(1)

  await page.getByRole('button', { name: 'New board' }).click()

  await expect(page).not.toHaveURL(first)
  await expect(page).toHaveURL(BOARD_URL)
  await waitForBoard(page)
  expect(await scene(page)).toHaveLength(0)
})

test('a board URL this browser has never seen opens an empty board at that URL', async ({
  page,
}) => {
  await openBoard(page, '/b/never-seen-before-0001')

  await expect(page).toHaveURL(/\/b\/never-seen-before-0001$/)
  expect(await scene(page)).toHaveLength(0)
})
