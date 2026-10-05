/** How a visitor appears to the other participants. There are no accounts, so this is all there is. */
export type Identity = {
  name: string
  /** A random string the visitor's colour is derived from, the same for everyone who sees them. */
  colourKey: string
}

const IDENTITY_KEY = 'tablo:identity'

const ADJECTIVES = [
  'Amber', 'Brisk', 'Calm', 'Clever', 'Coral', 'Dapper', 'Eager', 'Gentle', 'Golden', 'Hazel',
  'Indigo', 'Jolly', 'Keen', 'Lively', 'Mellow', 'Nimble', 'Olive', 'Plucky', 'Quiet', 'Rosy',
  'Silver', 'Sunny', 'Swift', 'Teal', 'Witty',
] // prettier-ignore

const ANIMALS = [
  'Badger', 'Crane', 'Dolphin', 'Falcon', 'Fox', 'Gecko', 'Heron', 'Ibis', 'Koala', 'Lemur',
  'Lynx', 'Marten', 'Newt', 'Otter', 'Owl', 'Panda', 'Puffin', 'Quail', 'Raven', 'Seal',
  'Sparrow', 'Tapir', 'Tiger', 'Wombat', 'Wren',
] // prettier-ignore

const pick = <T>(from: readonly T[]) => from[Math.floor(Math.random() * from.length)]

const newIdentity = (): Identity => ({
  name: `${pick(ADJECTIVES)} ${pick(ANIMALS)}`,
  colourKey: crypto.randomUUID(),
})

function stored(storage: Storage): Identity | null {
  try {
    const identity = JSON.parse(storage.getItem(IDENTITY_KEY) ?? 'null')
    return typeof identity?.name === 'string' && typeof identity?.colourKey === 'string'
      ? { name: identity.name, colourKey: identity.colourKey }
      : null
  } catch {
    return null
  }
}

/** This browser's identity: made up on the first visit, then remembered. */
export function loadIdentity(storage: Storage): Identity {
  const existing = stored(storage)
  if (existing) return existing
  const identity = newIdentity()
  try {
    storage.setItem(IDENTITY_KEY, JSON.stringify(identity))
  } catch {
    // Not remembered: the visitor gets a new identity next time, which is harmless.
  }
  return identity
}
