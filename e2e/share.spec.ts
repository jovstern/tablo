import { expect, test } from '@playwright/test'
import { openBoard } from './board'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test('"Share" copies the board link', async ({ page }) => {
  await openBoard(page, '/')

  await page.getByRole('button', { name: 'Share' }).click()

  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url())
})

test('"Share" confirms the copy, then goes back to normal', async ({ page }) => {
  await openBoard(page, '/')
  const share = page.getByRole('button', { name: 'Share' })

  await share.click()
  await expect(share).toHaveText('Link copied')

  await expect(share).toHaveText('Share', { timeout: 5000 })
})

test('"Share" says so when the link could not be copied', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('not allowed'))
  })
  await openBoard(page, '/')
  const share = page.getByRole('button', { name: 'Share' })

  await share.click()

  await expect(share).toHaveText('Copy failed')
})
