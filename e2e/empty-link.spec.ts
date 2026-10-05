import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, openParticipant, scene, tool, waitForBoard } from './board'

const notice = (page: Page) =>
  page.getByRole('status').filter({ hasText: 'this board may be incomplete' })

/** Long enough for the board to have connected and heard from anyone there. */
const settled = (page: Page) => page.waitForTimeout(700)

test('a link opened with nobody there and no copy says the board may be incomplete', async ({
  page,
}) => {
  await openBoard(page, '/b/a-link-someone-sent-me')

  await expect(notice(page)).toBeVisible()
})

test('a board made from the root URL has no notice', async ({ page }) => {
  await openBoard(page, '/')
  await settled(page)

  await expect(notice(page)).toHaveCount(0)
})

test('a board made with "New board" has no notice, even after a reload', async ({ page }) => {
  await openBoard(page, '/')
  await page.getByRole('button', { name: 'New board' }).click()
  await waitForBoard(page)
  await settled(page)
  await expect(notice(page)).toHaveCount(0)

  await page.reload()
  await waitForBoard(page)
  await settled(page)
  await expect(notice(page)).toHaveCount(0)
})

test('a board this browser has a copy of has no notice when opened by its link', async ({
  page,
}) => {
  await openBoard(page, '/')
  const board = page.url()
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await page.goto('about:blank')

  await openBoard(page, board)
  await settled(page)

  await expect(notice(page)).toHaveCount(0)
})

test('a link opened while a participant is there has no notice', async ({ page, browser }) => {
  await openBoard(page, '/')
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])

  const newcomer = await openParticipant(browser, page.url())
  await expect.poll(() => scene(newcomer)).toHaveLength(1)

  await expect(notice(newcomer)).toHaveCount(0)
})

test('the notice goes when a participant with the board arrives', async ({ page, browser }) => {
  await openBoard(page, '/')
  const board = page.url()
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await page.goto('about:blank')
  const ben = await openParticipant(browser, board)
  await expect(notice(ben)).toBeVisible()

  await openBoard(page, board)

  await expect.poll(() => scene(ben)).toHaveLength(1)
  await expect(notice(ben)).toHaveCount(0)
})

test('the notice can be dismissed', async ({ page }) => {
  await openBoard(page, '/b/a-link-someone-sent-me')

  await notice(page).getByRole('button', { name: 'Dismiss' }).click()

  await expect(notice(page)).toHaveCount(0)
})

test('a sent link reopened from the root URL still says it may be incomplete', async ({ page }) => {
  await openBoard(page, '/b/a-link-someone-sent-me')
  await expect(notice(page)).toBeVisible()

  // The root URL leads back to it as the recent board. It is still not the visitor's own.
  await openBoard(page, '/')

  await expect(page).toHaveURL(/a-link-someone-sent-me$/)
  await expect(notice(page)).toBeVisible()
})

test('a board the visitor made but never drew on has no notice when reopened by its link', async ({
  page,
}) => {
  await openBoard(page, '/')
  const board = page.url()
  await page.goto('about:blank')

  await openBoard(page, board)
  await settled(page)

  await expect(notice(page)).toHaveCount(0)
})
