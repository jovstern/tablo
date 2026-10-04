import { useEffect, useState } from 'react'
import type { BoardStore } from './boards/boardStore'
import { useAutosave } from './boards/useAutosave'
import { Chrome } from './chrome/Chrome'
import type { Engine, Theme } from './engine/engine'
import { EngineCanvas } from './engine/EngineCanvas'
import { loadIdentity } from './sync/identity'
import { useBoardSync } from './sync/useBoardSync'

type Props = {
  id: string
  /** Whether the visitor got here through tablo itself, not through a link someone sent. */
  ownBoard: boolean
  store: BoardStore
  theme: Theme
  onToggleTheme: () => void
}

/** One board: its canvas and the chrome around it. */
export function Board({ id, ownBoard, store, theme, onToggleTheme }: Props) {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [savedScene] = useState(() => store.load(id))

  useEffect(() => store.setRecentBoard(id), [id, store])
  // A board the visitor made is theirs from the start, drawn on or not: saving it
  // empty is what tells a later visit that this browser has the whole of it.
  useEffect(() => {
    if (ownBoard && savedScene === null) store.save(id, { elements: [] })
  }, [ownBoard, savedScene, id, store])
  const saveFailure = useAutosave(engine, id, store)
  const [identity] = useState(() => loadIdentity(window.localStorage))
  const sync = useBoardSync(engine, id, identity)

  // A link someone sent, opened with no copy here and nobody there to send one:
  // the relay keeps nothing, so what shows may not be the whole board (ADR 0003).
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const nobodyThere =
    sync.status === 'offline' || (sync.status === 'online' && sync.otherIds.length === 0)
  const mayBeIncomplete =
    !ownBoard && savedScene === null && !sync.receivedScene && nobodyThere && !noticeDismissed

  useEffect(() => {
    if (!import.meta.env.DEV || !engine) return
    window.__tablo = {
      boardId: id,
      scene: () => [...engine.scene().elements],
      otherParticipants: () => sync.otherIds.length,
      shownParticipants: () => engine.shownParticipants(),
    }
    return () => void delete window.__tablo
  }, [engine, id, sync])

  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-[#121212]">
      <EngineCanvas initialScene={savedScene} theme={theme} onReady={setEngine} />
      <Chrome
        engine={engine}
        saveFailure={saveFailure}
        sync={sync}
        mayBeIncomplete={mayBeIncomplete}
        onDismissIncomplete={() => setNoticeDismissed(true)}
        identity={identity}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  )
}
