import { DEFAULT_RELAY_PORT } from './frame.ts'
import { startRelay } from './relay.ts'

const relay = await startRelay({ port: Number(process.env.RELAY_PORT ?? DEFAULT_RELAY_PORT) })
console.log(`tablo relay listening on ws://localhost:${relay.port}`)
