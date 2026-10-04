import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { debounce } from './debounce'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('runs once, after the calls have stopped for the wait', () => {
  const run = vi.fn()
  const debounced = debounce(run, 300)

  debounced('first')
  vi.advanceTimersByTime(200)
  debounced('second')
  vi.advanceTimersByTime(299)
  expect(run).not.toHaveBeenCalled()

  vi.advanceTimersByTime(1)
  expect(run).toHaveBeenCalledExactlyOnceWith('second')
})

test('flush runs a pending call at once', () => {
  const run = vi.fn()
  const debounced = debounce(run, 300)
  debounced('pending')

  debounced.flush()

  expect(run).toHaveBeenCalledExactlyOnceWith('pending')
  vi.advanceTimersByTime(300)
  expect(run).toHaveBeenCalledTimes(1)
})

test('flush does nothing when no call is pending', () => {
  const run = vi.fn()

  debounce(run, 300).flush()

  expect(run).not.toHaveBeenCalled()
})
