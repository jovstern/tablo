# Edits converge by last writer wins per element, through a stateless relay

When several participants edit a board, each browser broadcasts the elements it changed and every browser merges what it receives with Excalidraw's own reconcile: per element, the higher version wins. A CRDT (Yjs) was the alternative. It would merge two simultaneous edits to the same element instead of dropping one, but it needs a third-party binding to Excalidraw and a second document model beside the scene, and for ten people sketching, losing one of two simultaneous edits to the same element is an acceptable cost.

The relay only forwards messages and keeps nothing (ADR 0002), so a newcomer gets the board from the participants already there, each of whom sends their full scene.

## Consequences

- Deleted elements stay in the scene as tombstones, in sync and in the board store. Without them a browser rejoining with an old copy would bring deleted elements back.
- A board that nobody else has open cannot be fetched: a link opens empty unless that browser already holds a copy.
- Everyone who opens a link keeps a copy of the board in their browser.
- Board contents cross the relay in plaintext. The unguessable board id is the only access control.
