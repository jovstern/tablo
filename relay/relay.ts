import { randomUUID } from 'node:crypto'
import { WebSocketServer, type WebSocket } from 'ws'

/**
 * The relay passes messages between the browsers on a board and keeps nothing (ADR 0002, 0003).
 *
 * A frame is a JSON header, a newline, then a body the relay never looks inside.
 * From a participant the header is `{}` to reach everyone else on the board or
 * `{"to": id}` to reach one participant. From the relay it is one of:
 *
 * - `{"type":"welcome","id":…,"participants":[…]}` to a newcomer: its id and who is already there
 * - `{"type":"joined","id":…}` and `{"type":"left","id":…}` to everyone else
 * - `{"type":"message","from":…}` followed by the sender's body
 */
export type Relay = {
  port: number
  close(): Promise<void>
}

type Options = {
  /** 0 picks a free port. */
  port: number
  /** Frames larger than this end the connection that sent them. */
  maxMessageBytes?: number
}

const DEFAULT_MAX_MESSAGE_BYTES = 4 * 1024 * 1024
const BOARD_PATH = /^\/b\/([A-Za-z0-9_-]+)$/
const POLICY_VIOLATION = 1008

const frame = (header: object, body = '') => `${JSON.stringify(header)}\n${body}`

export function startRelay({ port, maxMessageBytes = DEFAULT_MAX_MESSAGE_BYTES }: Options) {
  /** board id → participant id → connection */
  const boards = new Map<string, Map<string, WebSocket>>()
  const server = new WebSocketServer({ port, maxPayload: maxMessageBytes })

  server.on('connection', (socket, request) => {
    const boardId = BOARD_PATH.exec(new URL(request.url ?? '', 'ws://relay').pathname)?.[1]
    if (!boardId) return socket.close(POLICY_VIOLATION, 'No board named')

    const id = randomUUID()
    const board = boards.get(boardId) ?? new Map<string, WebSocket>()
    boards.set(boardId, board)

    const others = () => [...board].filter(([participant]) => participant !== id)
    const tellOthers = (text: string) => others().forEach(([, other]) => other.send(text))

    socket.send(frame({ type: 'welcome', id, participants: [...board.keys()] }))
    board.set(id, socket)
    tellOthers(frame({ type: 'joined', id }))

    socket.on('message', (data) => {
      const text = data.toString()
      const cut = text.indexOf('\n')
      if (cut < 0) return
      let to: unknown
      try {
        to = JSON.parse(text.slice(0, cut)).to
      } catch {
        return
      }
      const forwarded = frame({ type: 'message', from: id }, text.slice(cut + 1))
      if (typeof to === 'string') board.get(to)?.send(forwarded)
      else tellOthers(forwarded)
    })

    // An oversized frame surfaces as an error; the close that follows cleans up.
    socket.on('error', () => {})

    socket.on('close', () => {
      board.delete(id)
      if (board.size === 0) boards.delete(boardId)
      else tellOthers(frame({ type: 'left', id }))
    })
  })

  return new Promise<Relay>((resolve, reject) => {
    server.once('error', reject)
    server.once('listening', () => {
      const address = server.address()
      resolve({
        port: typeof address === 'object' && address ? address.port : port,
        close: () =>
          new Promise<void>((done) => {
            server.clients.forEach((client) => client.terminate())
            server.close(() => done())
          }),
      })
    })
  })
}
