import { afterEach, expect, test, vi } from 'vitest'
import { startRelay, type Relay } from '../../relay/relay.ts'
import type { Engine, SceneElement, ShownParticipant } from '../engine/engine'
import { startBoardSync, type BoardSync, type SyncState } from './boardSync'

/**
 * The sync client against a real relay, with a stand-in for the canvas: just
 * enough of the engine to hold elements and merge the way the real one does
 * (the higher version wins, and an element being edited locally is left alone).
 */
function participant(relay: Relay, name: string, options: { sendIntervalMs?: number } = {}) {
  let elements: SceneElement[] = []
  const editing = new Set<string>()
  const listeners = new Set<() => void>()
  let shown: readonly ShownParticipant[] = []
  let state: SyncState | undefined
  const notify = () => listeners.forEach((listener) => listener())
  const element = (id: string, version: number, isDeleted = false) =>
    ({ id, version, versionNonce: version, isDeleted }) as unknown as SceneElement

  const engine = {
    sceneWithTombstones: () => ({ elements }),
    applyRemoteElements(remote: readonly SceneElement[]) {
      for (const incoming of remote) {
        if (editing.has(incoming.id)) continue
        const local = elements.find((el) => el.id === incoming.id)
        if (local && local.version >= incoming.version) continue
        elements = [...elements.filter((el) => el.id !== incoming.id), incoming]
      }
      notify()
    },
    onSceneChange(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onActivity: () => () => {},
    showParticipants: (participants: readonly ShownParticipant[]) => void (shown = participants),
  } as unknown as Engine

  const sync: BoardSync = startBoardSync({
    engine,
    boardId: 'board',
    relayUrl: `ws://localhost:${relay.port}`,
    identity: { name, colourKey: name },
    onStateChange: (next) => void (state = next),
    sendIntervalMs: options.sendIntervalMs,
    maxMessageChars: 600,
  })
  started.push(sync)

  return {
    /** Draws an element, or changes it if it is already there. */
    change(id: string) {
      const version = (elements.find((el) => el.id === id)?.version ?? 0) + 1
      elements = [...elements.filter((el) => el.id !== id), element(id, version)]
      notify()
    },
    startEditing: (id: string) => void editing.add(id),
    stopEditing: (id: string) => void editing.delete(id),
    /** Every element's version, by id. */
    versions: () => Object.fromEntries(elements.map((el) => [el.id, el.version]).sort()),
    shownNames: () => shown.map((other) => other.name).sort(),
    state: () => state,
    others: () => state?.otherIds.length ?? 0,
    leave: () => sync.stop(),
  }
}

const started: BoardSync[] = []
let relay: Relay

afterEach(async () => {
  started.splice(0).forEach((sync) => sync.stop())
  await relay.close()
})

const until = (check: () => void) => vi.waitFor(check, { timeout: 4000, interval: 10 })

test('a change waiting to be sent when a newcomer arrives still reaches everyone', async () => {
  relay = await startRelay({ port: 0 })
  // A long send interval holds the second change back until after the newcomer has joined.
  const ana = participant(relay, 'Ana', { sendIntervalMs: 400 })
  const ben = participant(relay, 'Ben')
  await until(() => expect(ana.others()).toBe(1))
  ana.change('rectangle')
  ana.change('rectangle')
  await until(() => expect(ben.versions()).toEqual({ rectangle: 1 }))

  const cy = participant(relay, 'Cy')

  await until(() => expect(cy.versions()).toEqual({ rectangle: 2 }))
  await until(() => expect(ben.versions()).toEqual({ rectangle: 2 }))
})

test('three participants end up with the same board', async () => {
  relay = await startRelay({ port: 0 })
  const all = [participant(relay, 'Ana'), participant(relay, 'Ben'), participant(relay, 'Cy')]
  await until(() => all.forEach((each) => expect(each.others()).toBe(2)))

  all[0].change('rectangle')
  all[1].change('ellipse')
  all[2].change('arrow')

  const everything = { arrow: 1, ellipse: 1, rectangle: 1 }
  await until(() => all.forEach((each) => expect(each.versions()).toEqual(everything)))
})

test('a change that arrives for an element being edited is taken once the edit ends', async () => {
  relay = await startRelay({ port: 0 })
  const ana = participant(relay, 'Ana')
  const ben = participant(relay, 'Ben')
  await until(() => expect(ana.others()).toBe(1))
  ana.change('text')
  await until(() => expect(ben.versions()).toEqual({ text: 1 }))

  ben.startEditing('text')
  ana.change('text')
  ana.change('text')
  await new Promise((resolve) => setTimeout(resolve, 200))
  expect(ben.versions()).toEqual({ text: 1 })
  ben.stopEditing('text')

  await until(() => expect(ben.versions()).toEqual({ text: 3 }))
  expect(ana.versions()).toEqual({ text: 3 })
})

test('an edit made over a change that was held back is sent, so the boards agree', async () => {
  relay = await startRelay({ port: 0 })
  const ana = participant(relay, 'Ana')
  const ben = participant(relay, 'Ben')
  await until(() => expect(ana.others()).toBe(1))
  ana.change('text')
  await until(() => expect(ben.versions()).toEqual({ text: 1 }))

  // Ben edits while Ana's change (to version 2) arrives and is held back.
  ben.startEditing('text')
  ana.change('text')
  await new Promise((resolve) => setTimeout(resolve, 200))
  ben.change('text')
  ben.change('text')
  ben.stopEditing('text')

  await until(() => expect(ana.versions()).toEqual({ text: 3 }))
  expect(ben.versions()).toEqual({ text: 3 })
})

test('a board too big for one message still reaches a newcomer', async () => {
  relay = await startRelay({ port: 0, maxMessageBytes: 2000 })
  const ana = participant(relay, 'Ana')
  const ids = Array.from({ length: 60 }, (_, i) => `element-${String(i).padStart(2, '0')}`)
  ids.forEach((id) => ana.change(id))

  const ben = participant(relay, 'Ben')

  await until(() => expect(Object.keys(ben.versions())).toEqual(ids))
  expect(ana.state()?.status).toBe('online')
})

test('a message that makes no sense is ignored and the rest keeps working', async () => {
  relay = await startRelay({ port: 0 })
  const ana = participant(relay, 'Ana')
  await until(() => expect(ana.state()?.status).toBe('online'))
  const stranger = new WebSocket(`ws://localhost:${relay.port}/b/board`)
  await new Promise((resolve) => stranger.addEventListener('open', resolve))
  for (const body of [
    'not json',
    '{"type":"presence"}',
    '{"type":"scene","elements":"nope"}',
    '7',
  ]) {
    stranger.send(`{}\n${body}`)
  }

  const ben = participant(relay, 'Ben')
  ben.change('rectangle')

  await until(() => expect(ana.versions()).toEqual({ rectangle: 1 }))
  await until(() => expect(ana.shownNames()).toEqual(['Ben']))
  stranger.close()
})

test('when the relay comes back everyone reconnects and catches up', async () => {
  relay = await startRelay({ port: 0 })
  const { port } = relay
  const ana = participant(relay, 'Ana')
  const ben = participant(relay, 'Ben')
  await until(() => expect(ana.others()).toBe(1))

  await relay.close()
  await until(() => expect(ana.state()?.status).toBe('offline'))
  await until(() => expect(ben.state()?.status).toBe('offline'))
  ana.change('rectangle')
  ben.change('ellipse')
  relay = await startRelay({ port })

  const everything = { ellipse: 1, rectangle: 1 }
  await until(() => expect(ana.versions()).toEqual(everything))
  await until(() => expect(ben.versions()).toEqual(everything))
  expect(ana.state()?.status).toBe('online')
})
