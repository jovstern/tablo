import { expect, test, type Page } from '@playwright/test'
import { openBoard, waitForBoard } from './board'

const toggle = (page: Page) => page.getByRole('button', { name: 'Dark theme', exact: true })

/** Which theme the chrome and the canvas are each showing. */
const themes = (page: Page) =>
  page.evaluate(() => ({
    chrome: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    canvas: document.querySelector('.excalidraw.theme--dark') ? 'dark' : 'light',
  }))

test.describe('when the system is light', () => {
  test.use({ colorScheme: 'light' })

  test('tablo starts light', async ({ page }) => {
    await openBoard(page)

    expect(await themes(page)).toEqual({ chrome: 'light', canvas: 'light' })
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('the toggle switches the chrome and the canvas together', async ({ page }) => {
    await openBoard(page)

    await toggle(page).click()
    expect(await themes(page)).toEqual({ chrome: 'dark', canvas: 'dark' })
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')

    await toggle(page).click()
    expect(await themes(page)).toEqual({ chrome: 'light', canvas: 'light' })
  })

  test('the choice survives a reload', async ({ page }) => {
    await openBoard(page)
    await toggle(page).click()

    await page.reload()
    await waitForBoard(page)

    expect(await themes(page)).toEqual({ chrome: 'dark', canvas: 'dark' })
  })

  test('the choice carries over to a new board', async ({ page }) => {
    await openBoard(page)
    await toggle(page).click()

    await page.getByRole('button', { name: 'New board' }).click()
    await waitForBoard(page)

    expect(await themes(page)).toEqual({ chrome: 'dark', canvas: 'dark' })
  })
})

test.describe('when the system is dark', () => {
  test.use({ colorScheme: 'dark' })

  test('tablo starts dark', async ({ page }) => {
    await openBoard(page)

    expect(await themes(page)).toEqual({ chrome: 'dark', canvas: 'dark' })
  })

  test('a stored choice of light wins over the system', async ({ page }) => {
    await openBoard(page)
    await toggle(page).click()

    await page.reload()
    await waitForBoard(page)

    expect(await themes(page)).toEqual({ chrome: 'light', canvas: 'light' })
  })

  test('palette swatches show colours as the canvas renders them', async ({ page }) => {
    await openBoard(page)
    await page
      .getByRole('toolbar', { name: 'Tools' })
      .getByRole('button', { name: 'Rectangle' })
      .click()

    // The engine publishes the filter it applies to colours on a dark canvas.
    const filters = await page.evaluate(() => {
      const engine = document.querySelector('.excalidraw')!
      const probe = document.createElement('div')
      probe.style.filter = getComputedStyle(engine).getPropertyValue('--theme-filter')
      document.body.append(probe)
      return {
        canvas: getComputedStyle(probe).filter,
        swatch: getComputedStyle(document.querySelector('[data-swatch]')!).filter,
      }
    })

    expect(filters.canvas).not.toBe('none')
    expect(filters.swatch).toBe(filters.canvas)
  })
})

test('in the light theme palette swatches are shown as they are', async ({ page }) => {
  await openBoard(page)
  await page
    .getByRole('toolbar', { name: 'Tools' })
    .getByRole('button', { name: 'Rectangle' })
    .click()

  const filter = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-swatch]')!).filter,
  )

  expect(filter).toBe('none')
})
