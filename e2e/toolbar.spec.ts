import { expect, test } from '@playwright/test'
import { drag, openBoard, scene, tool } from './board'

for (const [name, type] of [
  ['Rectangle', 'rectangle'],
  ['Ellipse', 'ellipse'],
  ['Arrow', 'arrow'],
  ['Pen', 'freedraw'],
] as const) {
  test(`the ${name} tool draws a ${type}`, async ({ page }) => {
    await openBoard(page)

    await tool(page, name).click()
    await drag(page, [300, 300], [500, 420])

    expect((await scene(page)).map((el) => el.type)).toEqual([type])
  })
}

test('the Text tool adds text where the visitor clicks', async ({ page }) => {
  await openBoard(page)

  await tool(page, 'Text').click()
  await page.mouse.click(400, 300)
  await page.keyboard.type('hello')
  await page.keyboard.press('Escape')

  expect(await scene(page)).toMatchObject([{ type: 'text', text: 'hello' }])
})

test('the Select tool moves an element', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Rectangle').click()
  await drag(page, [300, 300], [500, 420])
  await page.keyboard.press('Escape')

  await tool(page, 'Select').click()
  await drag(page, [300, 360], [350, 400])

  expect(await scene(page)).toMatchObject([{ type: 'rectangle', x: 350, y: 340 }])
})

test('the tool bar shows which tool is active', async ({ page }) => {
  await openBoard(page)
  await expect(tool(page, 'Select')).toHaveAttribute('aria-pressed', 'true')

  await tool(page, 'Rectangle').click()

  await expect(tool(page, 'Rectangle')).toHaveAttribute('aria-pressed', 'true')
  await expect(tool(page, 'Select')).toHaveAttribute('aria-pressed', 'false')
})

test('the tool bar returns to Select once an element is drawn', async ({ page }) => {
  await openBoard(page)

  await tool(page, 'Ellipse').click()
  await expect(tool(page, 'Ellipse')).toHaveAttribute('aria-pressed', 'true')
  await drag(page, [300, 300], [500, 420])

  await expect(tool(page, 'Select')).toHaveAttribute('aria-pressed', 'true')
  await expect(tool(page, 'Ellipse')).toHaveAttribute('aria-pressed', 'false')
})

test('the tool bar follows keyboard shortcuts', async ({ page }) => {
  await openBoard(page)

  await page.keyboard.press('a')

  await expect(tool(page, 'Arrow')).toHaveAttribute('aria-pressed', 'true')
})

test('keyboard shortcuts still work after a tool was picked with the mouse', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Rectangle').click()

  await page.keyboard.press('o')
  await drag(page, [300, 300], [500, 420])

  expect((await scene(page)).map((el) => el.type)).toEqual(['ellipse'])
})

test('an arrow stays attached to the elements it connects', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Rectangle').click()
  await drag(page, [200, 300], [350, 400])
  await tool(page, 'Rectangle').click()
  await drag(page, [600, 300], [750, 400])
  await tool(page, 'Arrow').click()
  await drag(page, [340, 350], [610, 350])
  await page.keyboard.press('Escape')
  const before = (await scene(page)).find((el) => el.type === 'arrow')!

  // Move the second rectangle 150px to the right by its left edge.
  await drag(page, [600, 380], [750, 380])

  const after = (await scene(page)).find((el) => el.type === 'arrow')!
  expect(after.width).toBeGreaterThan(before.width + 100)
})
