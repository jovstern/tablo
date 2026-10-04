import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, scene, tool } from './board'

const editor = (page: Page) => page.locator('textarea')

test('the sticky note tool puts a filled sticky note at the centre of the view', async ({
  page,
}) => {
  await openBoard(page)
  const { width, height } = page.viewportSize()!

  await tool(page, 'Sticky note').click()
  await expect(editor(page)).toBeFocused()

  const [stickyNote] = await scene(page)
  expect(stickyNote).toMatchObject({ type: 'rectangle', backgroundColor: '#ffec99', roughness: 0 })
  expect(stickyNote.x + stickyNote.width / 2).toBeCloseTo(width / 2, 0)
  expect(stickyNote.y + stickyNote.height / 2).toBeCloseTo(height / 2, 0)
})

test('the visitor can type into a new sticky note at once', async ({ page }) => {
  await openBoard(page)

  await tool(page, 'Sticky note').click()
  await expect(editor(page)).toBeFocused()
  await page.keyboard.type('an idea')
  await page.keyboard.press('Escape')

  const elements = await scene(page)
  const stickyNote = elements.find((el) => el.type === 'rectangle')!
  expect(elements.find((el) => el.type === 'text')).toMatchObject({
    text: 'an idea',
    containerId: stickyNote.id,
  })
})

test("a sticky note's text moves with it", async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Sticky note').click()
  await expect(editor(page)).toBeFocused()
  await page.keyboard.type('an idea')
  await page.keyboard.press('Escape')
  const before = (await scene(page)).find((el) => el.type === 'text')!
  const { width, height } = page.viewportSize()!

  await drag(page, [width / 2, height / 2 - 60], [width / 2 + 200, height / 2 - 60])

  const after = (await scene(page)).find((el) => el.type === 'text')!
  expect(after.x).toBeCloseTo(before.x + 200, 0)
})

test("a sticky note's text is ink whatever the current stroke colour", async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Rectangle').click()
  await page
    .getByRole('radiogroup', { name: 'Stroke colour' })
    .getByRole('radio', { name: 'Red' })
    .click()

  await tool(page, 'Sticky note').click()
  await expect(editor(page)).toBeFocused()
  await page.keyboard.type('an idea')
  await page.keyboard.press('Escape')

  expect((await scene(page)).find((el) => el.type === 'text')).toMatchObject({
    strokeColor: '#1e1e1e',
  })
})

test('adding a sticky note leaves the current stroke colour alone', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Rectangle').click()
  await page
    .getByRole('radiogroup', { name: 'Stroke colour' })
    .getByRole('radio', { name: 'Red' })
    .click()
  await tool(page, 'Sticky note').click()
  await expect(editor(page)).toBeFocused()
  await page.keyboard.press('Escape')

  await tool(page, 'Ellipse').click()
  await drag(page, [100, 100], [200, 180])

  expect((await scene(page)).find((el) => el.type === 'ellipse')).toMatchObject({
    strokeColor: '#e03131',
  })
})

test('an empty sticky note is removed by one undo', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Sticky note').click()
  await expect(editor(page)).toBeFocused()
  await page.keyboard.press('Escape')
  expect(await scene(page)).toHaveLength(1)

  await page.keyboard.press('ControlOrMeta+z')

  expect(await scene(page)).toHaveLength(0)
})

test('a sticky note with text is removed by one undo', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Sticky note').click()
  await expect(editor(page)).toBeFocused()
  await page.keyboard.type('an idea')
  await page.keyboard.press('Escape')
  expect(await scene(page)).toHaveLength(2)

  await page.keyboard.press('ControlOrMeta+z')

  expect(await scene(page)).toHaveLength(0)
})
