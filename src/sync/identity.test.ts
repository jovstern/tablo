import { expect, test } from 'vitest'
import { fakeStorage } from '../boards/fakeStorage'
import { IDENTITY_COLOURS, loadIdentity } from './identity'

test('a visitor is given a two-word name and one of the identity colours', () => {
  const identity = loadIdentity(fakeStorage())

  expect(identity.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  expect(IDENTITY_COLOURS).toContain(identity.colour)
})

test('a visitor keeps the same identity on later visits', () => {
  const storage = fakeStorage()

  const first = loadIdentity(storage)

  expect(loadIdentity(storage)).toEqual(first)
})

test('visitors are not all given the same name', () => {
  const names = new Set(Array.from({ length: 50 }, () => loadIdentity(fakeStorage()).name))

  expect(names.size).toBeGreaterThan(10)
})

test('a stored identity that cannot be read is replaced', () => {
  const storage = fakeStorage()
  storage.setItem('tablo:identity', '{not json')

  const identity = loadIdentity(storage)

  expect(identity.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  expect(loadIdentity(storage)).toEqual(identity)
})

test('a visitor still gets an identity when storage is full', () => {
  const identity = loadIdentity(fakeStorage(0))

  expect(identity.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
})
