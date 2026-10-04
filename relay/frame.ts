/**
 * The wire format between a browser and the relay, shared by both ends.
 *
 * A frame is a JSON header, a newline, then a body the relay never looks inside.
 *
 * From a participant, the header says who the body is for:
 * - `{}`: everyone else on the board
 * - `{"to": id}`: one participant
 *
 * From the relay, the header says what happened:
 * - `{"type":"welcome","id":…,"participants":[…]}` to a newcomer: its id and who is already there
 * - `{"type":"joined","id":…}` and `{"type":"left","id":…}` to everyone else
 * - `{"type":"message","from":…}` followed by the body a participant sent
 */
export type RelayHeader =
  | { type: 'welcome'; id: string; participants: string[] }
  | { type: 'joined'; id: string }
  | { type: 'left'; id: string }
  | { type: 'message'; from: string }

export type ParticipantHeader = { to?: string }

export const encodeFrame = (header: RelayHeader | ParticipantHeader, body = '') =>
  `${JSON.stringify(header)}\n${body}`

/** Splits a frame into its header and body, or returns null if it is not one. */
export function decodeFrame<H>(frame: string): { header: H; body: string } | null {
  const cut = frame.indexOf('\n')
  if (cut < 0) return null
  try {
    return { header: JSON.parse(frame.slice(0, cut)) as H, body: frame.slice(cut + 1) }
  } catch {
    return null
  }
}

/** Where on the relay a board's participants connect. */
export const relayPath = (boardId: string) => `/b/${boardId}`

/** The relay's port when nothing else is configured. */
export const DEFAULT_RELAY_PORT = 8787
