import { useEffect, useState } from 'react'
import { DEFAULT_RELAY_PORT } from '../../relay/frame.ts'
import type { Engine } from '../engine/engine'
import { NOT_CONNECTED, startBoardSync, type SyncState } from './boardSync'
import type { Identity } from './identity'

const RELAY_URL: string =
  import.meta.env.VITE_RELAY_URL ?? `ws://${location.hostname}:${DEFAULT_RELAY_PORT}`

/** Connects a board to the relay for as long as it is on screen, and reports the connection's state. */
export function useBoardSync(
  engine: Engine | null,
  boardId: string,
  identity: Identity,
): SyncState {
  const [state, setState] = useState(NOT_CONNECTED)

  useEffect(() => {
    if (!engine) return
    const sync = startBoardSync({
      engine,
      boardId,
      relayUrl: RELAY_URL,
      identity,
      onStateChange: setState,
    })
    return () => sync.stop()
  }, [engine, boardId, identity])

  return state
}
