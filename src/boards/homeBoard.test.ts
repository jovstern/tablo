import { expect, test } from 'vitest'
import { fakeStorage } from './fakeStorage'
import { homeBoardId } from './homeBoard'
import { localStorageBoardStore } from './localStorageBoardStore'

test('the root URL leads to the recent board when there is one', () => {
  const store = localStorageBoardStore(fakeStorage())
  store.setRecentBoard('the-board-opened-last')

  expect(homeBoardId(store)).toBe('the-board-opened-last')
})

test('the root URL leads to a new board when none was opened before', () => {
  const store = localStorageBoardStore(fakeStorage())

  expect(homeBoardId(store)).toMatch(/^[A-Za-z0-9_-]{22}$/)
})
