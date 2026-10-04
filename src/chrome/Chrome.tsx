import { BoardMenu } from './BoardMenu'

/** Every control tablo draws around the canvas. Floats above it and lets the canvas take the rest. */
export function Chrome() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-zinc-800">
      <BoardMenu />
    </div>
  )
}
