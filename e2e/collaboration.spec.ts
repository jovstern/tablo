import { expect, test } from '@playwright/test'
import { drag, openParticipant, scene, tool, twoParticipants } from './board'

test("an element one participant draws appears on the other's board", async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)

  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])

  await expect
    .poll(() => scene(ben))
    .toMatchObject([{ type: 'rectangle', width: 200, height: 120 }])
})

test('changes flow in both directions', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)

  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)
  await tool(ben, 'Ellipse').click()
  await drag(ben, [600, 300], [700, 380])

  await expect
    .poll(async () => (await scene(ana)).map((el) => el.type).sort())
    .toEqual(['ellipse', 'rectangle'])
  expect((await scene(ben)).map((el) => el.type).sort()).toEqual(['ellipse', 'rectangle'])
})

test("a move and a restyle reach the other participant's board", async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)

  await ana
    .getByRole('radiogroup', { name: 'Stroke colour' })
    .getByRole('radio', { name: 'Red' })
    .click()
  await drag(ana, [300, 360], [350, 400])

  await expect.poll(() => scene(ben)).toMatchObject([{ x: 350, y: 340, strokeColor: '#e03131' }])
})

test("an element one participant deletes disappears from the other's board", async ({
  page,
  browser,
}) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)

  await ana.keyboard.press('Delete')

  await expect.poll(() => scene(ben)).toHaveLength(0)
})

test('the other participant can change an element they did not draw', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)

  // Ben moves Ana's rectangle by its left edge.
  await drag(ben, [300, 360], [350, 400])

  await expect.poll(() => scene(ana)).toMatchObject([{ x: 350, y: 340 }])
})

test("a participant's undo leaves the other participant's work alone", async ({
  page,
  browser,
}) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)

  // Receiving Ana's rectangle gave Ben nothing to undo.
  await expect(ben.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()

  await tool(ben, 'Ellipse').click()
  await drag(ben, [600, 300], [700, 380])
  await ben.getByRole('button', { name: 'Undo', exact: true }).click()

  await expect.poll(async () => (await scene(ben)).map((el) => el.type)).toEqual(['rectangle'])
  await expect.poll(async () => (await scene(ana)).map((el) => el.type)).toEqual(['rectangle'])
})

test('boards do not leak into each other', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  const [cy] = await twoParticipants(await (await browser.newContext()).newPage(), browser)

  await tool(ana, 'Rectangle').click()
  await drag(ana, [300, 300], [500, 420])
  await expect.poll(() => scene(ben)).toHaveLength(1)

  expect(await scene(cy)).toHaveLength(0)
})

test('three participants all see what each of them draws', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  const cy = await openParticipant(browser, ana.url())
  const everyone = [ana, ben, cy]
  for (const participant of everyone) {
    await participant.waitForFunction(() => window.__tablo!.otherParticipants() === 2)
  }

  await tool(ana, 'Rectangle').click()
  await drag(ana, [200, 250], [300, 330])
  await tool(ben, 'Ellipse').click()
  await drag(ben, [450, 250], [550, 330])
  await tool(cy, 'Arrow').click()
  await drag(cy, [700, 250], [800, 330])

  for (const participant of everyone) {
    await expect
      .poll(async () => (await scene(participant)).map((el) => el.type).sort())
      .toEqual(['arrow', 'ellipse', 'rectangle'])
  }
})
