import { decodeFrame, encodeFrame, relayPath, type RelayHeader } from '../../relay/frame.ts'

/** What the relay tells a participant. The wire format is in relay/frame.ts. */
export type RelayEvents = {
  /** Connected: this participant's id and the ids of those already on the board. */
  onWelcome(id: string, participants: string[]): void
  onJoined(id: string): void
  onLeft(id: string): void
  /** A message another participant sent, to everyone or to this participant alone. */
  onMessage(from: string, body: string): void
  /** The connection ended, or never opened. */
  onClose(): void
}

export type RelayConnection = {
  /**
   * Sends to everyone else on the board, or to one participant when `to` is given.
   * Says whether the message went out; it does not while the connection is not open.
   */
  send(body: string, to?: string): boolean
  close(): void
}

/** Connects to the relay as a participant on a board. */
export function connectToRelay(
  relayUrl: string,
  boardId: string,
  events: RelayEvents,
): RelayConnection {
  const socket = new WebSocket(relayUrl + relayPath(boardId))

  socket.addEventListener('message', (event) => {
    const frame = decodeFrame<RelayHeader>(String(event.data))
    if (!frame) return
    const { header, body } = frame
    if (header.type === 'welcome') events.onWelcome(header.id, header.participants)
    else if (header.type === 'joined') events.onJoined(header.id)
    else if (header.type === 'left') events.onLeft(header.id)
    else if (header.type === 'message') events.onMessage(header.from, body)
  })
  socket.addEventListener('close', () => events.onClose())

  return {
    send(body, to) {
      if (socket.readyState !== WebSocket.OPEN) return false
      socket.send(encodeFrame(to ? { to } : {}, body))
      return true
    },
    close: () => socket.close(),
  }
}
