/** How a visitor appears to the other participants. There are no accounts, so this is all there is. */
export type Identity = { name: string; colour: string }

const IDENTITY_KEY = 'tablo:identity'

/** Dark enough to read as a cursor on a light canvas; the canvas adjusts them in dark mode. */
export const IDENTITY_COLOURS = [
  '#e03131',
  '#c2255c',
  '#9c36b5',
  '#6741d9',
  '#3b5bdb',
  '#1971c2',
  '#0c8599',
  '#099268',
  '#2f9e44',
  '#e8590c',
]

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
  colour: pick(IDENTITY_COLOURS),
})

function stored(storage: Storage): Identity | null {
  try {
    const identity = JSON.parse(storage.getItem(IDENTITY_KEY) ?? 'null')
    return typeof identity?.name === 'string' && typeof identity?.colour === 'string'
      ? { name: identity.name, colour: identity.colour }
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
