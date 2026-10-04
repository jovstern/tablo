import type { Engine } from '../engine/engine'
import { BoardMenu } from './BoardMenu'
import { Dock } from './Dock'
import { HistoryControls } from './HistoryControls'

/**
 * Every control tablo draws around the canvas. Floats above it and lets the
 * canvas take the rest. Controls that drive the engine wait until it is ready.
 */
export function Chrome({ engine }: { engine: Engine | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-zinc-800">
      <BoardMenu />
      {engine && (
        <>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <HistoryControls engine={engine} />
          </div>
          <Dock engine={engine} />
        </>
      )}
    </div>
  )
}
