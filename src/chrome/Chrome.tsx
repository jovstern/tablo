import type { Engine, Theme } from '../engine/engine'
import { BoardMenu } from './BoardMenu'
import { Dock } from './Dock'
import { ExportButtons } from './ExportButtons'
import { HistoryControls } from './HistoryControls'
import { ThemeToggle } from './ThemeToggle'
import { card, divider } from './ui'
import { ZoomControls } from './ZoomControls'

/**
 * Every control tablo draws around the canvas. Floats above it and lets the
 * canvas take the rest. Controls that drive the engine wait until it is ready.
 */
type Props = {
  engine: Engine | null
  theme: Theme
  onToggleTheme: () => void
}

export function Chrome({ engine, theme, onToggleTheme }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-zinc-800 dark:text-zinc-100">
      <BoardMenu />
      <div className={`${card} absolute right-4 top-4 flex h-11 items-center gap-1 px-1.5`}>
        {engine && (
          <>
            <ExportButtons engine={engine} />
            <span className={`${divider} mx-1`} />
          </>
        )}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      {engine && (
        <>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <ZoomControls engine={engine} />
            <HistoryControls engine={engine} />
          </div>
          <Dock engine={engine} />
        </>
      )}
    </div>
  )
}
