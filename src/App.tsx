import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router'
import { Board } from './Board'
import { boardPath, newBoardId } from './boards/boardId'
import { localStorageBoardStore } from './boards/localStorageBoardStore'

const store = localStorageBoardStore(window.localStorage)

function BoardRoute() {
  const { id } = useParams()
  // Keyed so that each board gets a canvas of its own.
  return <Board key={id} id={id!} store={store} />
}

/** The root URL: back to the recent board, or on to a new one. */
function Home() {
  return <Navigate to={boardPath(store.recentBoard() ?? newBoardId())} replace />
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
