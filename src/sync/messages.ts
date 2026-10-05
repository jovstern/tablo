import type { Activity, SceneElement } from '../engine/engine'
import type { Identity } from './identity'

/** What participants send each other through the relay, as the body of a frame. */
export type Message =
  { type: 'scene'; elements: SceneElement[] } | ({ type: 'presence' } & Presence)

/** Who a participant is and what they are doing on the canvas. */
export type Presence = Identity & Activity

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isElement = (value: unknown) =>
  isRecord(value) && typeof value.id === 'string' && typeof value.version === 'number'

const isPoint = (value: unknown) =>
  isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number'

/**
 * Reads a message another participant sent, or returns null if it is not one.
 * Anyone with the link can send anything, and one bad message must not break
 * the board for the participant who receives it.
 */
export function readMessage(body: string): Message | null {
  let message: unknown
  try {
    message = JSON.parse(body)
  } catch {
    return null
  }
  if (!isRecord(message)) return null

  if (message.type === 'scene') {
    const { elements } = message
    if (!Array.isArray(elements) || !elements.every(isElement)) return null
    return { type: 'scene', elements: elements as SceneElement[] }
  }

  if (message.type === 'presence') {
    const { name, colourKey, pointer, selectedIds } = message
    if (typeof name !== 'string' || typeof colourKey !== 'string') return null
    if (pointer !== null && !isPoint(pointer)) return null
    if (!Array.isArray(selectedIds) || !selectedIds.every((id) => typeof id === 'string')) {
      return null
    }
    const point = pointer as { x: number; y: number } | null
    return {
      type: 'presence',
      name,
      colourKey,
      pointer: point && { x: point.x, y: point.y },
      selectedIds,
    }
  }

  return null
}

/**
 * Splits elements into batches whose JSON stays under a size, so that a large
 * board goes out as several messages instead of one the relay would refuse.
 * An element bigger than the size goes alone.
 */
export function inBatches(elements: readonly SceneElement[], maxChars: number): SceneElement[][] {
  const batches: SceneElement[][] = []
  let batch: SceneElement[] = []
  let size = 0
  for (const element of elements) {
    const chars = JSON.stringify(element).length
    if (batch.length > 0 && size + chars > maxChars) {
      batches.push(batch)
      batch = []
      size = 0
    }
    batch.push(element)
    size += chars
  }
  if (batch.length > 0) batches.push(batch)
  return batches
}
