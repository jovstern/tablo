import { useEffect, useState } from 'react'
import type { BoardStore } from './boards/boardStore'
import { useAutosave } from './boards/useAutosave'
import { Chrome } from './chrome/Chrome'
import type { Engine, Theme } from './engine/engine'
import { EngineCanvas } from './engine/EngineCanvas'
import { useBoardSync } from './sync/useBoardSync'

type Props = {
  id: string
  store: BoardStore
  theme: Theme
  onToggleTheme: () => void
}

/** One board: its canvas and the chrome around it. */
export function Board({ id, store, theme, onToggleTheme }: Props) {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [savedScene] = useState(() => store.load(id))

  useEffect(() => store.setRecentBoard(id), [id, store])
  const saveFailure = useAutosave(engine, id, store)
  const sync = useBoardSync(engine, id)

  useEffect(() => {
    if (!import.meta.env.DEV || !engine) return
    window.__tablo = {
      boardId: id,
      scene: () => [...engine.scene().elements],
      otherParticipants: () => sync.otherParticipants.length,
    }
    return () => void delete window.__tablo
  }, [engine, id, sync])

  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-[#121212]">
      <EngineCanvas initialScene={savedScene} theme={theme} onReady={setEngine} />
      <Chrome
        engine={engine}
        saveFailure={saveFailure}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  )
}
