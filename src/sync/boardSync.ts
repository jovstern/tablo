import type { Engine, SceneElement } from '../engine/engine'
import { connectToRelay } from './relayConnection'
import { throttle } from './throttle'

const SEND_INTERVAL_MS = 50

type Message = { type: 'scene'; elements: SceneElement[] }

/** What the rest of the app sees of a board's connection. A new object on every change. */
export type SyncState = {
  /** The ids of the other participants on the board right now. */
  otherParticipants: readonly string[]
}

export const NOT_CONNECTED: SyncState = { otherParticipants: [] }

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
  const report = () => onStateChange({ otherParticipants: [...others] })
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

  const connection = connectToRelay(relayUrl, boardId, {
    onWelcome(_id, participants) {
      participants.forEach((id) => others.add(id))
      report()
    },
    onJoined(id) {
      others.add(id)
      report()
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
      others.clear()
      report()
    },
  })

  const send = (message: Message, to?: string) => connection.send(JSON.stringify(message), to)

  const sendChanges = throttle(() => {
    const changed = engine
      .sceneWithTombstones()
      .elements.filter((element) => element.version > (shared.get(element.id) ?? 0))
    if (changed.length === 0) return
    markShared(changed)
    send({ type: 'scene', elements: changed })
  }, SEND_INTERVAL_MS)

  const unsubscribe = engine.onSceneChange(sendChanges)

  return {
    stop() {
      unsubscribe()
      sendChanges.cancel()
      connection.close()
    },
  }
}
