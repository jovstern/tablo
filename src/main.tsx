import { createRoot } from 'react-dom/client'
import '@excalidraw/excalidraw/index.css'
import './index.css'
import { ChromePrototype } from './prototype/ChromePrototype'

createRoot(document.getElementById('root')!).render(<ChromePrototype />)
