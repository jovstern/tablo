import type { Engine, SceneElement } from '../engine/engine'
import { reconnectDelay } from './reconnectDelay'
import { connectToRelay, type RelayConnection, type RelayEvents } from './relayConnection'
import { throttle } from './throttle'

const SEND_INTERVAL_MS = 50

type Message = { type: 'scene'; elements: SceneElement[] }

/** What the rest of the app sees of a board's connection. A new object on every change. */
export type SyncState = {
  /** `connecting` only until the first attempt succeeds or fails. */
  status: 'connecting' | 'online' | 'offline'
  /** The ids of the other participants on the board right now. */
  otherParticipants: readonly string[]
}

export const NOT_CONNECTED: SyncState = { status: 'connecting', otherParticipants: [] }

export type BoardSync = { stop(): void }

/**
 * Keeps a board in step with the other participants on it (ADR 0003): sends the
 * elements this browser changed and merges in the ones the others send.
 */
export function startBoardSync(
  engine: Engine,
  boardId: string,
  relayUrl: string,
  onStateChange: (state: SyncState) => void,
): BoardSync {
  const others = new Set<string>()
  let status: SyncState['status'] = 'connecting'
  const report = () => onStateChange({ status, otherParticipants: [...others] })
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
    },
    onJoined(id) {
      others.add(id)
      report()
      sendWholeScene(id)
    },
    onLeft(id) {
      others.delete(id)
      report()
    },
    onMessage(_from, body) {
      const message = JSON.parse(body) as Message
      if (message.type !== 'scene') return
      markShared(message.elements)
      engine.applyRemoteElements(message.elements)
    },
    onClose() {
      if (stopped) return
      // The board keeps working on its own. Whatever changes meanwhile is
      // exchanged as whole scenes once a connection is back (see onWelcome).
      status = 'offline'
      others.clear()
      report()
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

  const unsubscribe = engine.onSceneChange(sendChanges)
  connect()

  return {
    stop() {
      unsubscribe()
      stopped = true
      clearTimeout(retry)
      sendChanges.cancel()
      connection?.close()
    },
  }
}
