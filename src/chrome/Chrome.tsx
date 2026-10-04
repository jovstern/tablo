import type { Engine } from '../engine/engine'
import { BoardMenu } from './BoardMenu'
import { Dock } from './Dock'

/**
 * Every control tablo draws around the canvas. Floats above it and lets the
 * canvas take the rest. Controls that drive the engine wait until it is ready.
 */
export function Chrome({ engine }: { engine: Engine | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-zinc-800">
      <BoardMenu />
      {engine && <Dock engine={engine} />}
    </div>
  )
}
