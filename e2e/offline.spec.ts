import { expect, test, type Page, type WebSocketRoute } from '@playwright/test'
import { drag, openBoard, openParticipant, scene, tool, waitForBoard } from './board'

const offline = (page: Page) => page.getByRole('status').filter({ hasText: 'Offline' })
const types = async (page: Page) => (await scene(page)).map((el) => el.type).sort()

/** Puts a switch on this page's connection to the relay. Call before opening a board. */
async function relaySwitch(page: Page, { down = false } = {}) {
  const open = new Set<{ page: WebSocketRoute; relay: WebSocketRoute }>()
  await page.routeWebSocket(/\/b\/[\w-]+$/, (route) => {
    if (down) return void route.close()
    // With no handlers attached, messages pass through in both directions.
    open.add({ page: route, relay: route.connectToServer() })
  })
  return {
    async cut() {
      down = true
      for (const connection of open) {
        await connection.relay.close()
        await connection.page.close()
      }
      open.clear()
    },
    restore: () => void (down = false),
  }
}

test('there is no offline status while the relay is reachable', async ({ page }) => {
  await openBoard(page, '/')
  await page.waitForTimeout(500)

  await expect(offline(page)).toHaveCount(0)
})

test('with the relay unreachable the board works and says it is offline', async ({ page }) => {
  await relaySwitch(page, { down: true })
  await openBoard(page, '/')

  await expect(offline(page)).toBeVisible()
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await page.reload()
  await waitForBoard(page)

  expect(await types(page)).toEqual(['rectangle'])
})

test('a dropped connection shows offline, then reconnects by itself', async ({ page }) => {
  const relay = await relaySwitch(page)
  await openBoard(page, '/')
  await expect(offline(page)).toHaveCount(0)

  await relay.cut()
  await expect(offline(page)).toBeVisible()

  relay.restore()
  await expect(offline(page)).toHaveCount(0)
})

test('changes made on both sides while disconnected reach the other on reconnect', async ({
  page,
  browser,
}) => {
  const relay = await relaySwitch(page)
  await openBoard(page, '/')
  const ben = await openParticipant(browser, page.url())
  await page.waitForFunction(() => window.__tablo!.otherParticipants() === 1)

  await relay.cut()
  await expect(offline(page)).toBeVisible()
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await tool(ben, 'Ellipse').click()
  await drag(ben, [600, 300], [700, 380])
  expect(await types(ben)).toEqual(['ellipse'])

  relay.restore()

  await expect.poll(() => types(page)).toEqual(['ellipse', 'rectangle'])
  await expect.poll(() => types(ben)).toEqual(['ellipse', 'rectangle'])
})

test('losing the network shows offline at once, and getting it back reconnects', async ({
  page,
  context,
}) => {
  await openBoard(page, '/')
  await expect(offline(page)).toHaveCount(0)

  await context.setOffline(true)
  await expect(offline(page)).toBeVisible()

  await context.setOffline(false)
  await expect(offline(page)).toHaveCount(0)
})
