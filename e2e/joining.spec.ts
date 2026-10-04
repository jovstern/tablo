import { expect, test } from '@playwright/test'
import {
  drag,
  openBoard,
  openParticipant,
  scene,
  tool,
  twoParticipants,
  waitForBoard,
} from './board'

const types = async (page: Parameters<typeof scene>[0]) =>
  (await scene(page)).map((el) => el.type).sort()

test('a newcomer with no copy gets the whole board from a participant', async ({
  page,
  browser,
}) => {
  await openBoard(page, '/')
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await tool(page, 'Ellipse').click()
  await drag(page, [600, 300], [700, 380])

  const newcomer = await openParticipant(browser, page.url())

  await expect.poll(() => types(newcomer)).toEqual(['ellipse', 'rectangle'])
})

test('a returning visitor and a participant each get what the other has', async ({
  page,
  browser,
}) => {
  // Ana draws a rectangle and leaves; her browser keeps its copy.
  await openBoard(page, '/')
  const board = page.url()
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await page.goto('about:blank')

  // Ben opens the link with nobody there, so he starts empty, and draws an ellipse.
  const ben = await openParticipant(browser, board)
  await tool(ben, 'Ellipse').click()
  await drag(ben, [600, 300], [700, 380])

  await openBoard(page, board)

  await expect.poll(() => types(page)).toEqual(['ellipse', 'rectangle'])
  await expect.poll(() => types(ben)).toEqual(['ellipse', 'rectangle'])
})

test('an element deleted while a visitor was away stays deleted when they return', async ({
  page,
  browser,
}) => {
  const [ana, ben] = await twoParticipants(page, browser)
  const board = ana.url()
  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)

  // Ben leaves with the rectangle in his copy. Ana deletes it, then reloads,
  // so the deletion has to survive in her saved copy.
  await ben.goto('about:blank')
  await ana.keyboard.press('Delete')
  await ana.reload()
  await waitForBoard(ana)
  expect(await scene(ana)).toHaveLength(0)

  await openBoard(ben, board)
  await ben.waitForFunction(() => window.__tablo!.otherParticipants() === 1)

  await expect.poll(() => scene(ben)).toHaveLength(0)
  await ana.waitForTimeout(300)
  expect(await scene(ana)).toHaveLength(0)
})

test('a deleted element is not shown again after a reload', async ({ page }) => {
  await openBoard(page, '/')
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await tool(page, 'Ellipse').click()
  await drag(page, [600, 300], [700, 380])
  await page.keyboard.press('Delete')

  await page.reload()
  await waitForBoard(page)

  expect(await types(page)).toEqual(['rectangle'])
})
