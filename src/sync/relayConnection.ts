/** What the relay tells a participant. See relay/relay.ts for the wire format. */
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
  /** Sends to everyone else on the board, or to one participant when `to` is given. */
  send(body: string, to?: string): void
  close(): void
}

type Header =
  | { type: 'welcome'; id: string; participants: string[] }
  | { type: 'joined'; id: string }
  | { type: 'left'; id: string }
  | { type: 'message'; from: string }

/** Opens a connection to a board's room on the relay. */
export function connectToRelay(
  relayUrl: string,
  boardId: string,
  events: RelayEvents,
): RelayConnection {
  const socket = new WebSocket(`${relayUrl}/b/${boardId}`)

  socket.addEventListener('message', (event) => {
    const text = String(event.data)
    const cut = text.indexOf('\n')
    const header = JSON.parse(text.slice(0, cut)) as Header
    if (header.type === 'welcome') events.onWelcome(header.id, header.participants)
    else if (header.type === 'joined') events.onJoined(header.id)
    else if (header.type === 'left') events.onLeft(header.id)
    else events.onMessage(header.from, text.slice(cut + 1))
  })
  socket.addEventListener('close', () => events.onClose())

  return {
    send(body, to) {
      if (socket.readyState !== WebSocket.OPEN) return
      socket.send(`${JSON.stringify(to ? { to } : {})}\n${body}`)
    },
    close: () => socket.close(),
  }
}
