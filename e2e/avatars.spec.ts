import { expect, test, type Page } from '@playwright/test'
import { openBoard, twoParticipants } from './board'

const nameOf = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tablo:identity')!).name as string)

const avatars = (page: Page) =>
  page.getByRole('list', { name: 'Participants' }).getByRole('listitem')

/** The accessible names of the avatars, in the order shown. */
const avatarNames = (page: Page) =>
  avatars(page).evaluateAll((items) => items.map((item) => item.getAttribute('aria-label')))

test('alone on a board, a visitor sees only their own avatar, marked as theirs', async ({
  page,
}) => {
  await openBoard(page, '/')

  expect(await avatarNames(page)).toEqual([`${await nameOf(page)} (you)`])
})

test('each participant sees themselves first and then the other', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  const [anaName, benName] = [await nameOf(ana), await nameOf(ben)]

  await expect.poll(() => avatarNames(ana)).toEqual([`${anaName} (you)`, benName])
  await expect.poll(() => avatarNames(ben)).toEqual([`${benName} (you)`, anaName])
})

test('an avatar shows its participant’s initials', async ({ page }) => {
  await openBoard(page, '/')
  const initials = (await nameOf(page))
    .split(' ')
    .map((word) => word[0])
    .join('')

  await expect(avatars(page).first()).toHaveText(initials)
})

test('an avatar goes when its participant leaves', async ({ page, browser }) => {
  const [ana, ben] = await twoParticipants(page, browser)
  await expect(avatars(ben)).toHaveCount(2)

  await ana.goto('about:blank')

  await expect(avatars(ben)).toHaveCount(1)
})
