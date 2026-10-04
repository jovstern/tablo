import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { drag, openBoard } from './board'

const MARGIN = 24

async function download(page: Page, button: string) {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: button, exact: true }).click(),
  ])
  return { name: file.suggestedFilename(), bytes: await readFile(await file.path()) }
}

/** Two rectangles whose outer edges span 500 x 320 on the canvas. */
async function drawTwoRectangles(page: Page) {
  await page.keyboard.press('r')
  await drag(page, [200, 200], [300, 280])
  await page.keyboard.press('r')
  await drag(page, [600, 440], [700, 520])
}

async function addText(page: Page, text: string) {
  await page.keyboard.press('t')
  await page.mouse.click(400, 150)
  await page.keyboard.type(text)
  await page.keyboard.press('Escape')
}

test('PNG export downloads a PNG of the whole scene with a margin', async ({ page }) => {
  await openBoard(page)
  await drawTwoRectangles(page)

  const { name, bytes } = await download(page, 'Export PNG')

  expect(name).toBe('tablo.png')
  expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  // The image header holds the size: big enough for both rectangles and the margin.
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  expect(width).toBeGreaterThanOrEqual(500 + 2 * MARGIN)
  expect(height).toBeGreaterThanOrEqual(320 + 2 * MARGIN)
})

test('SVG export downloads an SVG of the whole scene with a margin', async ({ page }) => {
  await openBoard(page)
  await drawTwoRectangles(page)
  await addText(page, 'hello tablo')

  const { name, bytes } = await download(page, 'Export SVG')
  const svg = bytes.toString('utf8')

  expect(name).toBe('tablo.svg')
  expect(svg).toMatch(/^<svg[\s>]/)
  expect(svg).toContain('hello tablo')
  const [, width, height] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.map(Number)
  expect(width).toBeGreaterThanOrEqual(500 + 2 * MARGIN)
  expect(height).toBeGreaterThanOrEqual(320 + 2 * MARGIN)
})

test('exports have a background', async ({ page }) => {
  await openBoard(page)
  await drawTwoRectangles(page)

  const svg = (await download(page, 'Export SVG')).bytes.toString('utf8')

  // A rectangle covering the whole image, drawn before the elements.
  expect(svg).toMatch(/<rect x="0" y="0" width="[\d.]+" height="[\d.]+" fill="#[0-9a-f]{6}"/i)
})
