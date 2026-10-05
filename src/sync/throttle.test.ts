import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { throttle } from './throttle'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('the first call runs at once', () => {
  const run = vi.fn()

  throttle(run, 50)()

  expect(run).toHaveBeenCalledTimes(1)
})

test('calls during the wait collapse into one run at its end', () => {
  const run = vi.fn()
  const throttled = throttle(run, 50)
  throttled()

  throttled()
  throttled()
  vi.advanceTimersByTime(49)
  expect(run).toHaveBeenCalledTimes(1)

  vi.advanceTimersByTime(1)
  expect(run).toHaveBeenCalledTimes(2)
})

test('a call after a quiet wait runs at once again', () => {
  const run = vi.fn()
  const throttled = throttle(run, 50)
  throttled()
  vi.advanceTimersByTime(50)

  throttled()

  expect(run).toHaveBeenCalledTimes(2)
})

test('cancel drops a run that was waiting', () => {
  const run = vi.fn()
  const throttled = throttle(run, 50)
  throttled()
  throttled()

  throttled.cancel()
  vi.advanceTimersByTime(50)

  expect(run).toHaveBeenCalledTimes(1)
})
