import type { Activity, Engine, SceneElement } from '../engine/engine'
import type { Identity } from './identity'
import { reconnectDelay } from './reconnectDelay'
import { connectToRelay, type RelayConnection, type RelayEvents } from './relayConnection'
import { throttle } from './throttle'

const SEND_INTERVAL_MS = 50

type Message =
  { type: 'scene'; elements: SceneElement[] } | ({ type: 'presence' } & Identity & Activity)

/** What the rest of the app sees of a board's connection. A new object on every change. */
export type SyncState = {
  /** `connecting` only until the first attempt succeeds or fails. */
  status: 'connecting' | 'online' | 'offline'
  /** The ids of the other participants on the board right now. */
  otherParticipants: readonly string[]
  /** Those of them who have said who they are, which each does on arriving. */
  others: readonly (Identity & { id: string })[]
}

export const NOT_CONNECTED: SyncState = { status: 'connecting', otherParticipants: [], others: [] }

export type BoardSync = { stop(): void }

/**
 * Keeps a board in step with the other participants on it (ADR 0003): sends the
 * elements this browser changed and merges in the ones the others send.
 */
export function startBoardSync(
  engine: Engine,
  boardId: string,
  relayUrl: string,
  identity: Identity,
  onStateChange: (state: SyncState) => void,
): BoardSync {
  let activity: Activity = { pointer: null, selectedIds: [] }
  const others = new Set<string>()
  /** What each other participant last said of themselves, by their id. */
  const presences = new Map<string, Identity & Activity>()
  const showPresences = () =>
    engine.showParticipants([...presences].map(([id, presence]) => ({ id, ...presence })))
  let status: SyncState['status'] = 'connecting'
  const report = () =>
    onStateChange({
      status,
      otherParticipants: [...others],
      others: [...presences].map(([id, { name, colour }]) => ({ id, name, colour })),
    })
  /**
   * The newest version of each element the others are known to have, because it
   * was sent to them or came from them. Only newer versions are sent, which is
   * also what stops a received change from being sent straight back.
   */
  const shared = new Map<string, number>()
  const markShared = (elements: readonly SceneElement[]) =>
    elements.forEach((element) =>
      shared.set(element.id, Math.max(element.version, shared.get(element.id) ?? 0)),
    )
  markShared(engine.sceneWithTombstones().elements)

  let connection: RelayConnection | undefined
  let failedAttempts = 0
  let retry: ReturnType<typeof setTimeout> | undefined
  let stopped = false

  const events: RelayEvents = {
    onWelcome(_id, participants) {
      failedAttempts = 0
      status = 'online'
      participants.forEach((id) => others.add(id))
      report()
      // A newcomer may hold a copy with elements the others lack. The others
      // each send theirs in reply to the relay's announcement (see onJoined).
      if (participants.length > 0) sendWholeScene()
      sendPresence()
    },
    onJoined(id) {
      others.add(id)
      report()
      sendWholeScene(id)
      sendPresence(id)
    },
    onLeft(id) {
      others.delete(id)
      presences.delete(id)
      report()
      showPresences()
    },
    onMessage(from, body) {
      const message = JSON.parse(body) as Message
      if (message.type === 'scene') {
        markShared(message.elements)
        engine.applyRemoteElements(message.elements)
      } else if (message.type === 'presence') {
        const { name, colour, pointer, selectedIds } = message
        const isNew = !presences.has(from)
        presences.set(from, { name, colour, pointer, selectedIds })
        showPresences()
        // Pointer moves arrive many times a second; who is here changes only on arrival.
        if (isNew) report()
      }
    },
    onClose() {
      if (stopped) return
      // The board keeps working on its own. Whatever changes meanwhile is
      // exchanged as whole scenes once a connection is back (see onWelcome).
      status = 'offline'
      others.clear()
      presences.clear()
      report()
      showPresences()
      failedAttempts += 1
      retry = setTimeout(connect, reconnectDelay(failedAttempts))
    },
  }
  const connect = () => {
    connection = connectToRelay(relayUrl, boardId, events)
  }

  const send = (message: Message, to?: string) => connection?.send(JSON.stringify(message), to)

  /** The relay keeps nothing, so a newcomer gets the board from the participants there. */
  const sendWholeScene = (to?: string) => {
    const { elements } = engine.sceneWithTombstones()
    if (elements.length === 0) return
    markShared(elements)
    send({ type: 'scene', elements: [...elements] }, to)
  }

  const sendChanges = throttle(() => {
    const changed = engine
      .sceneWithTombstones()
      .elements.filter((element) => element.version > (shared.get(element.id) ?? 0))
    if (changed.length === 0) return
    markShared(changed)
    send({ type: 'scene', elements: changed })
  }, SEND_INTERVAL_MS)

  const sendPresence = (to?: string) => send({ type: 'presence', ...identity, ...activity }, to)
  const sendActivity = throttle(() => sendPresence(), SEND_INTERVAL_MS)

  const stopSceneChanges = engine.onSceneChange(sendChanges)
  const stopActivity = engine.onActivity((next) => {
    activity = next
    sendActivity()
  })
  connect()

  return {
    stop() {
      stopSceneChanges()
      stopActivity()
      stopped = true
      clearTimeout(retry)
      sendChanges.cancel()
      sendActivity.cancel()
      connection?.close()
    },
  }
}
