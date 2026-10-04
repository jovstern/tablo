import { expect, test } from 'vitest'
import { fakeStorage } from './fakeStorage'
import { homeBoard } from './homeBoard'
import { localStorageBoardStore } from './localStorageBoardStore'

test('the root URL leads to the recent board when there is one', () => {
  const store = localStorageBoardStore(fakeStorage())
  store.setRecentBoard('the-board-opened-last')

  expect(homeBoard(store)).toEqual({ id: 'the-board-opened-last', isNew: false })
})

test('the root URL leads to a new board when none was opened before', () => {
  const store = localStorageBoardStore(fakeStorage())

  const { id, isNew } = homeBoard(store)

  expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/)
  expect(isNew).toBe(true)
})
