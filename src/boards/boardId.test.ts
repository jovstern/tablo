import { expect, test } from 'vitest'
import { newBoardId } from './boardId'

test('a board id is 22 URL-safe characters, enough for 128 random bits', () => {
  expect(newBoardId()).toMatch(/^[A-Za-z0-9_-]{22}$/)
})

test('board ids do not repeat', () => {
  const ids = new Set(Array.from({ length: 1000 }, newBoardId))
  expect(ids.size).toBe(1000)
})
