import type { Activity, Engine, SceneElement } from '../engine/engine'
import type { Identity } from './identity'
import { inBatches, readMessage, type Message, type Presence } from './messages'
import { reconnectDelay } from './reconnectDelay'
import { connectToRelay, type RelayConnection } from './relayConnection'
import { throttle } from './throttle'

const SEND_INTERVAL_MS = 50
const HELD_BACK_RETRY_MS = 300
/** Well under the relay's cap on a frame. */
const MAX_MESSAGE_CHARS = 256_000

/** Another participant on the board who has said who they are. */
export type OtherParticipant = Identity & { id: string }

/** What the rest of the app sees of a board's connection. A new object on every change. */
export type SyncState = {
  /** `connecting` only until the first attempt succeeds or fails. */
  status: 'connecting' | 'online' | 'offline'
  /** The ids of the other participants on the board right now. */
  otherIds: readonly string[]
  /** Those of them who have said who they are, which each does on arriving. */
  others: readonly OtherParticipant[]
  /** Whether any participant has sent this browser elements of the board. */
  receivedScene: boolean
}

export const NOT_CONNECTED: SyncState = {
  status: 'connecting',
  otherIds: [],
  others: [],
  receivedScene: false,
}

export type BoardSync = { stop(): void }

type Options = {
  engine: Engine
  boardId: string
  relayUrl: string
  identity: Identity
  onStateChange: (state: SyncState) => void
  /** How often, at most, changes and presence are sent. */
  sendIntervalMs?: number
  /** The largest message to send in one piece. */
  maxMessageChars?: number
}

/**
 * Keeps a board in step with the other participants on it (ADR 0003): sends the
 * elements this browser changed and merges in the ones the others send.
 */
export function startBoardSync({
  engine,
  boardId,
  relayUrl,
  identity,
  onStateChange,
  sendIntervalMs = SEND_INTERVAL_MS,
  maxMessageChars = MAX_MESSAGE_CHARS,
}: Options): BoardSync {
  let status: SyncState['status'] = 'connecting'
  let receivedScene = false
  let activity: Activity = { pointer: null, selectedIds: [] }
  const otherIds = new Set<string>()
  /** What each other participant last said of themselves, by their id. */
  const presences = new Map<string, Presence>()

  const report = () =>
    onStateChange({
      status,
      otherIds: [...otherIds],
      others: [...presences].map(([id, { name, colourKey }]) => ({ id, name, colourKey })),
      receivedScene,
    })
  const showPresences = () =>
    engine.showParticipants([...presences].map(([id, presence]) => ({ id, ...presence })))

  // --- The connection, and getting it back ---

  let connection: RelayConnection | undefined
  let failedAttempts = 0
  let retry: ReturnType<typeof setTimeout> | undefined
  let stopped = false

  const send = (message: Message, to?: string) =>
    connection?.send(JSON.stringify(message), to) ?? false

  const connect = () => {
    const opened: RelayConnection = connectToRelay(relayUrl, boardId, {
      onWelcome(_id, participants) {
        failedAttempts = 0
        status = 'online'
        participants.forEach((id) => otherIds.add(id))
        report()
        // A newcomer may hold a copy with elements the others lack. The others
        // each send theirs in reply to the relay's announcement (see onJoined).
        // This exchange of whole scenes is also what resyncs after a reconnect.
        if (participants.length > 0) sendWholeScene()
        sendPresence()
      },
      onJoined(id) {
        otherIds.add(id)
        report()
        sendWholeScene(id)
        sendPresence(id)
      },
      onLeft(id) {
        otherIds.delete(id)
        presences.delete(id)
        report()
        showPresences()
      },
      onMessage(from, body) {
        const message = readMessage(body)
        if (message?.type === 'scene') {
          merge(message.elements)
          if (!receivedScene) {
            receivedScene = true
            report()
          }
        } else if (message?.type === 'presence') {
          const { name, colourKey, pointer, selectedIds } = message
          const isNew = !presences.has(from)
          presences.set(from, { name, colourKey, pointer, selectedIds })
          showPresences()
          // Pointer moves arrive many times a second; who is here changes only on arrival.
          if (isNew) report()
        }
      },
      onClose: () => lost(opened),
    })
    connection = opened
  }

  /** The board keeps working on its own; the connection is retried with a growing wait. */
  const lost = (which: RelayConnection) => {
    if (stopped || which !== connection) return
    connection = undefined
    status = 'offline'
    otherIds.clear()
    presences.clear()
    report()
    showPresences()
    failedAttempts += 1
    retry = setTimeout(connect, reconnectDelay(failedAttempts))
  }

  // The browser knows the network went before a socket notices, sometimes long before.
  const networkLost = () => {
    const dead = connection
    dead?.close()
    if (dead) lost(dead)
  }
  const networkBack = () => {
    if (stopped || connection) return
    clearTimeout(retry)
    connect()
  }
  globalThis.addEventListener?.('offline', networkLost)
  globalThis.addEventListener?.('online', networkBack)

  // --- Elements ---

  /**
   * The newest version of each element that every other participant is known to
   * have, because it was sent to all of them or one of them sent it. Only newer
   * versions are sent, which is also what stops a received change being sent back.
   */
  const shared = new Map<string, number>()
  const markShared = (elements: readonly SceneElement[]) =>
    elements.forEach((element) =>
      shared.set(element.id, Math.max(element.version, shared.get(element.id) ?? 0)),
    )
  markShared(engine.sceneWithTombstones().elements)

  /** Sends elements in as many messages as their size needs. Says whether they went out. */
  const sendElements = (elements: readonly SceneElement[], to?: string) =>
    inBatches(elements, maxMessageChars)
      .map((batch) => send({ type: 'scene', elements: batch }, to))
      .every(Boolean)

  /** The relay keeps nothing, so a newcomer gets the board from the participants there. */
  const sendWholeScene = (to?: string) => {
    const { elements } = engine.sceneWithTombstones()
    // Sent to one participant, it says nothing about what the others have.
    if (sendElements(elements, to) && to === undefined) markShared(elements)
  }

  /**
   * Elements a participant sent that are newer than this browser's but were not
   * taken, because the engine leaves alone an element the visitor is in the
   * middle of editing. They are offered again until taken or overtaken.
   */
  const heldBack = new Map<string, SceneElement>()
  let heldBackRetry: ReturnType<typeof setTimeout> | undefined
  let merging = false

  const merge = (incoming: readonly SceneElement[]) => {
    merging = true
    try {
      engine.applyRemoteElements(incoming)
    } finally {
      merging = false
    }
    const local = new Map(engine.sceneWithTombstones().elements.map((el) => [el.id, el]))
    for (const element of incoming) {
      const mine = local.get(element.id)
      if (!mine || mine.version < element.version) {
        heldBack.set(element.id, element)
        continue
      }
      heldBack.delete(element.id)
      // Taken as sent, so the sender has it. A newer local version is not marked,
      // and goes out with the next send.
      const taken = mine.version === element.version && mine.versionNonce === element.versionNonce
      if (taken) markShared([element])
    }
    clearTimeout(heldBackRetry)
    if (heldBack.size > 0) heldBackRetry = setTimeout(offerHeldBack, HELD_BACK_RETRY_MS)
  }
  const offerHeldBack = () => {
    if (heldBack.size > 0) merge([...heldBack.values()])
  }

  const sendChanges = throttle(() => {
    offerHeldBack()
    const changed = engine
      .sceneWithTombstones()
      .elements.filter((element) => element.version > (shared.get(element.id) ?? 0))
    if (changed.length > 0 && sendElements(changed)) markShared(changed)
  }, sendIntervalMs)

  // --- Presence ---

  const sendPresence = (to?: string) => send({ type: 'presence', ...identity, ...activity }, to)
  const sendActivity = throttle(() => sendPresence(), sendIntervalMs)

  const stopSceneChanges = engine.onSceneChange(() => {
    // Merging changes the scene too, but there is nothing in that to send.
    if (!merging) sendChanges()
  })
  const stopActivity = engine.onActivity((next) => {
    activity = next
    sendActivity()
  })
  connect()

  return {
    stop() {
      stopped = true
      stopSceneChanges()
      stopActivity()
      globalThis.removeEventListener?.('offline', networkLost)
      globalThis.removeEventListener?.('online', networkBack)
      clearTimeout(retry)
      clearTimeout(heldBackRetry)
      sendChanges.cancel()
      sendActivity.cancel()
      connection?.close()
    },
  }
}
