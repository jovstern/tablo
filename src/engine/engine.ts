import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'

/** One element on the canvas, in the engine's own format (ADR 0001). */
export type SceneElement = OrderedExcalidrawElement

/** The full set of elements on a board at one moment. It is what gets saved and exported. */
export type Scene = { elements: readonly SceneElement[] }

export type Unsubscribe = () => void

export type Theme = 'light' | 'dark'

export type ImageFormat = 'png' | 'svg'

/** What a drag on the canvas does: select, or create one kind of element. */
export type Tool = 'select' | 'rectangle' | 'ellipse' | 'arrow' | 'pen' | 'text'

/** How an element is drawn. Colours are stored as they look in the light theme. */
export type Style = {
  strokeColor: string
  fill: string
  strokeWidth: number
}

/** How a new sticky note looks. `ink` colours both its outline and its text. */
export type StickyNoteLook = { fill: string; ink: string; strokeWidth: number }

/** What the chrome shows of the engine. A new object whenever anything in it changes. */
export type EngineState = {
  /** The active tool, or null while the engine is in a tool the chrome does not offer. */
  tool: Tool | null
  hasSelection: boolean
  /**
   * The style of the selection, or of the next element when nothing is selected.
   * A property is null when the selected elements disagree on it.
   */
  style: { [K in keyof Style]: Style[K] | null }
  canUndo: boolean
  canRedo: boolean
  /** The zoom level, where 1 is 100%. */
  zoom: number
}

/**
 * Everything tablo may ask of the engine. The chrome depends on this interface
 * and never on the engine itself.
 */
export interface Engine {
  /** The scene as it is now, without deleted elements. */
  scene(): Scene
  /**
   * Calls back whenever the scene changes. The one place scene changes leave the
   * engine: autosave listens here, and a relay would too (ADR 0002).
   */
  onSceneChange(listener: () => void): Unsubscribe

  /** The current state, the same object until something in it changes. */
  state(): EngineState
  onStateChange(listener: () => void): Unsubscribe

  setTool(tool: Tool): void
  /** Restyles the selection, as one undoable step, and makes the style stick for the next element. */
  applyStyle(style: Partial<Style>): void
  undo(): void
  redo(): void
  /** Zooming keeps the centre of the view fixed. */
  zoomIn(): void
  zoomOut(): void
  resetZoom(): void
  /** The whole scene as an image in the current theme, with a background and a margin around it. */
  exportImage(format: ImageFormat): Promise<Blob>
  /**
   * Adds a sticky note (a filled rectangle with text bound inside it) at the centre
   * of the view and puts the caret in it. The current style is left as it was.
   */
  addStickyNote(look: StickyNoteLook): void
}
