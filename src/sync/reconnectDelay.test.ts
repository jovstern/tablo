import { expect, test } from 'vitest'
import { reconnectDelay } from './reconnectDelay'

test('the first retry comes after a second', () => {
  expect(reconnectDelay(1)).toBe(1000)
})

test('each retry waits twice as long as the one before', () => {
  expect([1, 2, 3, 4].map(reconnectDelay)).toEqual([1000, 2000, 4000, 8000])
})

test('retries never wait longer than half a minute', () => {
  expect(reconnectDelay(6)).toBe(30_000)
  expect(reconnectDelay(50)).toBe(30_000)
})
