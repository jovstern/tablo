import type { SaveFailure } from '../boards/useAutosave'
import type { Engine, Theme } from '../engine/engine'
import { BoardMenu } from './BoardMenu'
import { Dock } from './Dock'
import { ExportButtons } from './ExportButtons'
import { HistoryControls } from './HistoryControls'
import { SaveWarning } from './SaveWarning'
import { ThemeToggle } from './ThemeToggle'
import { card, divider } from './ui'
import { ZoomControls } from './ZoomControls'

/**
 * Every control tablo draws around the canvas. Floats above it and lets the
 * canvas take the rest. Controls that drive the engine wait until it is ready.
 */
type Props = {
  engine: Engine | null
  /** Why the board is not being saved, or null while saving works. */
  saveFailure: SaveFailure | null
  theme: Theme
  onToggleTheme: () => void
}

export function Chrome({ engine, saveFailure, theme, onToggleTheme }: Props) {
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
          {/* In a narrow window the tool bar needs the bottom edge to itself. */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 max-lg:bottom-auto max-lg:top-[4.5rem]">
            <ZoomControls engine={engine} />
            <HistoryControls engine={engine} />
          </div>
          <Dock engine={engine} />
          {saveFailure && <SaveWarning failure={saveFailure} engine={engine} />}
        </>
      )}
    </div>
  )
}
