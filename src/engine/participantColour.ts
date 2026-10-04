/**
 * The colour the engine draws a participant's cursor in. The engine does not let
 * the colour be chosen: it derives it from the id it is given for the participant,
 * and offers no call to ask what it picked. This repeats its derivation (a string
 * hash onto 37 pastel hues) so the chrome can show the same colour. A browser test
 * compares a cursor's pixels with its avatar, so an engine upgrade that changes the
 * derivation fails loudly.
 */
export function participantColour(colourKey: string): string {
  let hash = 0
  for (let i = 0; i < colourKey.length; i++) {
    hash = (hash << 5) - hash + colourKey.charCodeAt(i)
  }
  return `hsl(${(Math.abs(hash) % 37) * 10}, 100%, 83%)`
}
