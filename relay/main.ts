import { startRelay } from './relay.ts'

const relay = await startRelay({ port: Number(process.env.RELAY_PORT ?? 5174) })
console.log(`tablo relay listening on ws://localhost:${relay.port}`)
