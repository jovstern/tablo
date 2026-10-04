import { afterEach, expect, test } from 'vitest'
import { WebSocket } from 'ws'
import { startRelay, type Relay } from './relay.ts'

type Frame = { header: Record<string, unknown>; body: string }

let relay: Relay
const sockets: WebSocket[] = []

afterEach(async () => {
  sockets.forEach((socket) => socket.close())
  sockets.length = 0
  await relay.close()
})

/** A participant's connection, with the frames it has received so far. */
async function join(board: string) {
  const socket = new WebSocket(`ws://localhost:${relay.port}/b/${board}`)
  sockets.push(socket)
  const frames: Frame[] = []
  const waiting: (() => void)[] = []
  socket.on('message', (data) => {
    const text = data.toString()
    const cut = text.indexOf('\n')
    frames.push({ header: JSON.parse(text.slice(0, cut)), body: text.slice(cut + 1) })
    waiting.splice(0).forEach((wake) => wake())
  })
  /** The next frame of a type, waiting for it if it has not arrived yet. */
  const next = async (type: string): Promise<Frame> => {
    for (;;) {
      const at = frames.findIndex((frame) => frame.header.type === type)
      if (at >= 0) return frames.splice(at, 1)[0]
      await new Promise<void>((wake) => waiting.push(wake))
    }
  }
  const welcome = await next('welcome')
  return {
    id: welcome.header.id as string,
    present: welcome.header.participants as string[],
    next,
    frames,
    send: (body: string, to?: string) =>
      socket.send(`${JSON.stringify(to ? { to } : {})}\n${body}`),
    leave: () => socket.close(),
    closed: new Promise<number>((resolve) => socket.on('close', resolve)),
  }
}

/** Long enough for the relay to have delivered anything it was going to. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 100))

test('a participant is welcomed with an id and who is already there', async () => {
  relay = await startRelay({ port: 0 })

  const first = await join('board')
  const second = await join('board')

  expect(first.present).toEqual([])
  expect(second.present).toEqual([first.id])
  expect(second.id).not.toBe(first.id)
})

test('participants are told when someone joins and leaves', async () => {
  relay = await startRelay({ port: 0 })
  const first = await join('board')

  const second = await join('board')
  expect((await first.next('joined')).header.id).toBe(second.id)

  second.leave()
  expect((await first.next('left')).header.id).toBe(second.id)
})

test('a message reaches everyone else on the board, marked with its sender', async () => {
  relay = await startRelay({ port: 0 })
  const sender = await join('board')
  const others = [await join('board'), await join('board')]

  sender.send('{"hello":"board"}')

  for (const other of others) {
    const frame = await other.next('message')
    expect(frame.header.from).toBe(sender.id)
    expect(frame.body).toBe('{"hello":"board"}')
  }
  await settle()
  expect(sender.frames.filter((frame) => frame.header.type === 'message')).toEqual([])
})

test('a message does not reach other boards', async () => {
  relay = await startRelay({ port: 0 })
  const sender = await join('board-a')
  const sameBoard = await join('board-a')
  const otherBoard = await join('board-b')

  sender.send('only for a')

  await sameBoard.next('message')
  await settle()
  expect(otherBoard.frames).toEqual([])
})

test('an addressed message reaches only the participant it names', async () => {
  relay = await startRelay({ port: 0 })
  const sender = await join('board')
  const named = await join('board')
  const bystander = await join('board')

  sender.send('just for you', named.id)

  expect((await named.next('message')).body).toBe('just for you')
  await settle()
  expect(bystander.frames.filter((frame) => frame.header.type === 'message')).toEqual([])
})

test('a message over the size cap ends the connection and is not delivered', async () => {
  relay = await startRelay({ port: 0, maxMessageBytes: 1000 })
  const sender = await join('board')
  const other = await join('board')

  sender.send('x'.repeat(2000))

  expect(await sender.closed).toBe(1009)
  expect((await other.next('left')).header.id).toBe(sender.id)
  expect(other.frames.filter((frame) => frame.header.type === 'message')).toEqual([])
})

test('a connection that names no board is refused', async () => {
  relay = await startRelay({ port: 0 })
  const socket = new WebSocket(`ws://localhost:${relay.port}/elsewhere`)
  sockets.push(socket)

  const code = await new Promise<number>((resolve) => {
    socket.on('close', resolve)
    socket.on('error', () => {})
  })

  expect(code).toBe(1008)
})
