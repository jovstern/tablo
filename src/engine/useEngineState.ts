import { useSyncExternalStore } from 'react'
import type { Engine, EngineState } from './engine'

/** The engine's state, re-rendering the caller whenever it changes. */
export function useEngineState(engine: Engine): EngineState {
  return useSyncExternalStore(engine.onStateChange, engine.state)
}
