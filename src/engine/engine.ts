import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'

/** One element on the canvas, in the engine's own format (ADR 0001). */
export type SceneElement = OrderedExcalidrawElement

/**
 * Everything tablo may ask of the engine. The chrome depends on this interface
 * and never on the engine itself.
 */
export interface Engine {
  /** The elements currently on the canvas, without deleted ones. */
  scene(): readonly SceneElement[]
}
