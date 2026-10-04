import type { Engine } from '../engine/engine'
import { useEngineState } from '../engine/useEngineState'
import { StyleBar } from './StyleBar'
import { ToolBar } from './ToolBar'

/** Bottom centre: the tool bar, with the style bar above it while it has something to style. */
export function Dock({ engine }: { engine: Engine }) {
  const { tool, hasSelection } = useEngineState(engine)
  const styling = hasSelection || (tool !== null && tool !== 'select')
  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
      {styling && <StyleBar engine={engine} />}
      <ToolBar engine={engine} />
    </div>
  )
}
