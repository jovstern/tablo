import { expect, test } from 'vitest'
import type { Scene } from '../engine/engine'
import { fakeStorage } from './fakeStorage'
import { localStorageBoardStore } from './localStorageBoardStore'

const sceneOf = (...ids: string[]) => ({ elements: ids.map((id) => ({ id })) }) as unknown as Scene

test('a board that was never saved loads as nothing', () => {
  const store = localStorageBoardStore(fakeStorage())

  expect(store.load('a')).toBeNull()
})

test('a saved scene loads back', () => {
  const store = localStorageBoardStore(fakeStorage())

  expect(store.save('a', sceneOf('rect-1', 'rect-2'))).toEqual({ ok: true })

  expect(store.load('a')).toEqual(sceneOf('rect-1', 'rect-2'))
})

test('boards are saved separately', () => {
  const store = localStorageBoardStore(fakeStorage())

  store.save('a', sceneOf('on-a'))
  store.save('b', sceneOf('on-b'))

  expect(store.load('a')).toEqual(sceneOf('on-a'))
  expect(store.load('b')).toEqual(sceneOf('on-b'))
})

test('a saved board outlives the store that saved it', () => {
  const storage = fakeStorage()
  localStorageBoardStore(storage).save('a', sceneOf('rect-1'))

  expect(localStorageBoardStore(storage).load('a')).toEqual(sceneOf('rect-1'))
})

test('there is no recent board until one is set', () => {
  const store = localStorageBoardStore(fakeStorage())

  expect(store.recentBoard()).toBeNull()
})

test('the recent board is the one set last', () => {
  const store = localStorageBoardStore(fakeStorage())

  store.setRecentBoard('a')
  store.setRecentBoard('b')

  expect(store.recentBoard()).toBe('b')
})

test('a save that does not fit reports that the quota is full', () => {
  const store = localStorageBoardStore(fakeStorage(200))

  expect(store.save('a', sceneOf('x'.repeat(500)))).toEqual({ ok: false, reason: 'quota' })
})

test('a save that does not fit leaves every stored board as it was', () => {
  const store = localStorageBoardStore(fakeStorage(200))
  store.save('a', sceneOf('small'))
  store.save('b', sceneOf('also-small'))

  store.save('a', sceneOf('x'.repeat(500)))

  expect(store.load('a')).toEqual(sceneOf('small'))
  expect(store.load('b')).toEqual(sceneOf('also-small'))
})

test('saving works again once the scene fits', () => {
  const store = localStorageBoardStore(fakeStorage(200))
  store.save('a', sceneOf('x'.repeat(500)))

  expect(store.save('a', sceneOf('fits'))).toEqual({ ok: true })
  expect(store.load('a')).toEqual(sceneOf('fits'))
})

test('a stored board that cannot be read loads as nothing', () => {
  const storage = fakeStorage()
  storage.setItem('tablo:board:a', '{not json')

  expect(localStorageBoardStore(storage).load('a')).toBeNull()
})
