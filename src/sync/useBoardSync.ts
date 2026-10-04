import { useEffect, useState } from 'react'
import type { Engine } from '../engine/engine'
import { NOT_CONNECTED, startBoardSync, type SyncState } from './boardSync'

const RELAY_URL: string = import.meta.env.VITE_RELAY_URL ?? `ws://${location.hostname}:5174`

/** Connects a board to the relay for as long as it is on screen, and reports the connection's state. */
export function useBoardSync(engine: Engine | null, boardId: string): SyncState {
  const [state, setState] = useState(NOT_CONNECTED)

  useEffect(() => {
    if (!engine) return
    const sync = startBoardSync(engine, boardId, RELAY_URL, setState)
    return () => sync.stop()
  }, [engine, boardId])

  return state
}
