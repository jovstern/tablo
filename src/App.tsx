import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router'
import { Board } from './Board'
import { boardPath, newBoardId } from './boards/boardId'

function BoardRoute() {
  const { id } = useParams()
  // Keyed so that each board gets a canvas of its own.
  return <Board key={id} id={id!} />
}

function Home() {
  return <Navigate to={boardPath(newBoardId())} replace />
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
