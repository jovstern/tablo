import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard, scene, tool } from './board'

const styleBar = (page: Page) => page.getByRole('group', { name: 'Style' })
const option = (page: Page, group: string, name: string) =>
  page.getByRole('radiogroup', { name: group }).getByRole('radio', { name, exact: true })

async function drawRectangle(page: Page, from: [number, number] = [300, 300]) {
  await tool(page, 'Rectangle').click()
  await drag(page, from, [from[0] + 200, from[1] + 120])
}

test('the style bar is hidden on an idle board', async ({ page }) => {
  await openBoard(page)

  await expect(styleBar(page)).toHaveCount(0)
})

test('the style bar appears while a drawing tool is active', async ({ page }) => {
  await openBoard(page)

  await tool(page, 'Rectangle').click()

  await expect(styleBar(page)).toBeVisible()
})

test('the style bar appears while something is selected and goes when nothing is', async ({
  page,
}) => {
  await openBoard(page)
  await drawRectangle(page)
  await expect(styleBar(page)).toBeVisible()

  // Click an empty part of the canvas to deselect.
  await page.mouse.click(900, 150)

  await expect(styleBar(page)).toHaveCount(0)
})

test('choosing a stroke colour, fill and width restyles the selection', async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page)

  await option(page, 'Stroke colour', 'Red').click()
  await option(page, 'Fill', 'Yellow').click()
  await option(page, 'Stroke width', 'Thick').click()

  expect(await scene(page)).toMatchObject([
    { strokeColor: '#e03131', backgroundColor: '#ffec99', strokeWidth: 4 },
  ])
})

test('a restyle can be undone', async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page)
  await option(page, 'Stroke colour', 'Red').click()

  await page.keyboard.press('ControlOrMeta+z')

  expect(await scene(page)).toMatchObject([{ type: 'rectangle', strokeColor: '#1e1e1e' }])
})

test('a style chosen for a selection applies to the next element drawn', async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page)
  await option(page, 'Stroke colour', 'Green').click()
  await option(page, 'Stroke width', 'Thin').click()

  await drawRectangle(page, [300, 500])

  expect((await scene(page))[1]).toMatchObject({ strokeColor: '#2f9e44', strokeWidth: 1 })
})

test('a style chosen with a drawing tool active applies to what is drawn', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Ellipse').click()

  await option(page, 'Stroke colour', 'Blue').click()
  await option(page, 'Fill', 'Blue').click()
  await drag(page, [300, 300], [500, 420])

  expect(await scene(page)).toMatchObject([
    { type: 'ellipse', strokeColor: '#1971c2', backgroundColor: '#a5d8ff' },
  ])
})

test('only the palette is offered', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Rectangle').click()

  const names = (group: string) =>
    page
      .getByRole('radiogroup', { name: group })
      .getByRole('radio')
      .evaluateAll((radios) => radios.map((radio) => radio.getAttribute('aria-label')))
  expect(await names('Stroke colour')).toEqual([
    'Ink',
    'Grey',
    'Red',
    'Orange',
    'Green',
    'Blue',
    'Violet',
  ])
  expect(await names('Fill')).toEqual(['None', 'Grey', 'Red', 'Yellow', 'Green', 'Blue', 'Violet'])
  expect(await names('Stroke width')).toEqual(['Thin', 'Medium', 'Thick'])
  await expect(styleBar(page).locator('input')).toHaveCount(0)
})

test('the style bar shows the defaults as checked', async ({ page }) => {
  await openBoard(page)
  await tool(page, 'Rectangle').click()

  await expect(option(page, 'Stroke colour', 'Ink')).toBeChecked()
  await expect(option(page, 'Fill', 'None')).toBeChecked()
  await expect(option(page, 'Stroke width', 'Medium')).toBeChecked()
})

test("the style bar shows the selected element's style", async ({ page }) => {
  await openBoard(page)
  await drawRectangle(page)
  await option(page, 'Stroke colour', 'Red').click()
  await drawRectangle(page, [300, 500])
  await option(page, 'Stroke colour', 'Blue').click()
  await expect(option(page, 'Stroke colour', 'Blue')).toBeChecked()

  // Select the first rectangle by its top edge.
  await page.mouse.click(400, 300)

  await expect(option(page, 'Stroke colour', 'Red')).toBeChecked()
  await expect(option(page, 'Stroke colour', 'Blue')).not.toBeChecked()
})
