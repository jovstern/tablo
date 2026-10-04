import { randomUUID } from 'node:crypto'
import { WebSocketServer, type WebSocket } from 'ws'
import {
  decodeFrame,
  encodeFrame,
  relayPath,
  type ParticipantHeader,
  type RelayHeader,
} from './frame.ts'

/** The relay passes frames between the browsers on a board and keeps nothing (ADR 0002, 0003). */
export type Relay = {
  port: number
  close(): Promise<void>
}

type Options = {
  /** 0 picks a free port. */
  port: number
  /** Frames larger than this end the connection that sent them. */
  maxMessageBytes?: number
  /** How often each connection is checked for still being there. */
  heartbeatMs?: number
}

const DEFAULT_MAX_MESSAGE_BYTES = 4 * 1024 * 1024
const DEFAULT_HEARTBEAT_MS = 30_000
const BOARD_PATH = new RegExp(`^${relayPath('([A-Za-z0-9_-]+)')}$`)
const POLICY_VIOLATION = 1008

export function startRelay({
  port,
  maxMessageBytes = DEFAULT_MAX_MESSAGE_BYTES,
  heartbeatMs = DEFAULT_HEARTBEAT_MS,
}: Options) {
  /** board id → participant id → connection */
  const boards = new Map<string, Map<string, WebSocket>>()
  const server = new WebSocketServer({ port, maxPayload: maxMessageBytes })

  // A connection that vanished without closing (a sleeping laptop, a dropped
  // network) would otherwise stay on its board for good. One that has not
  // answered the last ping by the next round is dropped.
  const answered = new WeakSet<WebSocket>()
  const heartbeat = setInterval(() => {
    for (const socket of server.clients) {
      if (!answered.has(socket)) {
        socket.terminate()
        continue
      }
      answered.delete(socket)
      socket.ping()
    }
  }, heartbeatMs)

  server.on('connection', (socket, request) => {
    const boardId = BOARD_PATH.exec(new URL(request.url ?? '', 'ws://relay').pathname)?.[1]
    if (!boardId) return socket.close(POLICY_VIOLATION, 'No board named')

    const id = randomUUID()
    const participants = boards.get(boardId) ?? new Map<string, WebSocket>()
    boards.set(boardId, participants)

    const tellOthers = (header: RelayHeader, body?: string) => {
      const frame = encodeFrame(header, body)
      for (const [other, connection] of participants) if (other !== id) connection.send(frame)
    }

    answered.add(socket)
    socket.on('pong', () => answered.add(socket))

    socket.send(encodeFrame({ type: 'welcome', id, participants: [...participants.keys()] }))
    participants.set(id, socket)
    tellOthers({ type: 'joined', id })

    socket.on('message', (data) => {
      const frame = decodeFrame<ParticipantHeader>(data.toString())
      if (!frame) return
      const { to } = frame.header ?? {}
      if (typeof to === 'string') {
        participants.get(to)?.send(encodeFrame({ type: 'message', from: id }, frame.body))
      } else {
        tellOthers({ type: 'message', from: id }, frame.body)
      }
    })

    // An oversized frame surfaces as an error; the close that follows cleans up.
    socket.on('error', () => {})

    socket.on('close', () => {
      participants.delete(id)
      if (participants.size === 0) boards.delete(boardId)
      else tellOthers({ type: 'left', id })
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
            clearInterval(heartbeat)
            server.clients.forEach((client) => client.terminate())
            server.close(() => done())
          }),
      })
    })
  })
}
