import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'

/** One element on the canvas, in the engine's own format (ADR 0001). */
export type SceneElement = OrderedExcalidrawElement

/** The full set of elements on a board at one moment. It is what gets saved and exported. */
export type Scene = { elements: readonly SceneElement[] }

export type Unsubscribe = () => void

/**
 * Everything tablo may ask of the engine. The chrome depends on this interface
 * and never on the engine itself.
 */
export interface Engine {
  /** The elements currently on the canvas, without deleted ones. */
  scene(): readonly SceneElement[]
  /**
   * Calls back whenever the scene changes. The one place scene changes leave the
   * engine: autosave listens here, and a relay would too (ADR 0002).
   */
  onSceneChange(listener: () => void): Unsubscribe
}
