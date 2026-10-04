import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router'
import { Board } from './Board'
import { boardPath, OWN_BOARD } from './boards/boardId'
import { homeBoardId } from './boards/homeBoard'
import { localStorageBoardStore } from './boards/localStorageBoardStore'
import { useTheme } from './theme/useTheme'

const store = localStorageBoardStore(window.localStorage)

function BoardRoute() {
  const { id } = useParams()
  const { state } = useLocation()
  const [theme, toggleTheme] = useTheme(window.localStorage)
  // Keyed so that each board gets a canvas of its own.
  return (
    <Board
      key={id}
      id={id!}
      ownBoard={state === OWN_BOARD}
      store={store}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )
}

/** The root URL: back to the recent board, or on to a new one. */
function Home() {
  return <Navigate to={boardPath(homeBoardId(store))} state={OWN_BOARD} replace />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/b/:id" element={<BoardRoute />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
