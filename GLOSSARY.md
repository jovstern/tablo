# tablo

A whiteboard in the browser for sketching ideas, diagrams and flows, chosen for speed, simplicity and its UI.

## Language

**Visitor**:
The person using tablo in a browser. There are no accounts, so there is no other kind of person yet.
_Avoid_: User, viewer, customer

**Board**:
One whiteboard, identified by an unguessable id and reachable at its own URL.
_Avoid_: Room, document, drawing, file

**Canvas**:
The infinite surface of a board that elements are drawn on and that the visitor pans and zooms.
_Avoid_: Stage, viewport, whiteboard

**Element**:
A single thing on the canvas: a rectangle, ellipse, arrow, pen stroke, text or sticky note.
_Avoid_: Shape, object, node

**Sticky note**:
A filled rectangle with text bound inside it, added from the tool bar in one step.
_Avoid_: Note, post-it, card

**Scene**:
The full set of elements on a board at one moment. It is what gets saved and exported.
_Avoid_: State, content, snapshot

**Engine**:
The embedded canvas library that draws the scene and handles pointer and keyboard input on the canvas.
_Avoid_: Renderer, editor

**Chrome**:
Every control tablo draws around the canvas: tool bar, style bar, history, zoom, export, theme toggle and new-board button.
_Avoid_: UI, toolbar (for the whole), shell

**Tool**:
The mode that decides what a drag on the canvas does: select, or create one kind of element.
_Avoid_: Mode, brush

**Palette**:
The small fixed set of stroke and fill colours the chrome offers.
_Avoid_: Colour picker

**Swatch**:
One colour of the palette as the chrome shows it, already adjusted for the theme.
_Avoid_: Chip, dot

**Board store**:
The place a board's scene is saved and loaded from. In milestone 1 it is the browser's own storage.
_Avoid_: Database, persistence layer, backend

**Recent board**:
The board this browser opened last, which the root URL reopens.
_Avoid_: Last board, default board, home board

**Relay**:
The server that passes messages between the browsers on a board. It keeps nothing: every browser holds its own copy of the board.
_Avoid_: Backend, sync server, room server

**Participant**:
A visitor who is on a board while it is connected to the relay, as the others on that board see them.
_Avoid_: Peer, collaborator, user, member

**Presence**:
What participants see of each other while on a board: cursors with names, selections, and who is there.
_Avoid_: Awareness, status

**Identity**:
The name and colour a visitor is given on their first visit and keeps in that browser. It is how participants tell each other apart.
_Avoid_: Profile, account, user

**Activity**:
What a participant is doing on the canvas that the others see: where their pointer is and what they have selected.
_Avoid_: Cursor state, awareness

**Tombstone**:
A deleted element kept in the scene so the deletion reaches browsers that still hold the element.
_Avoid_: Soft delete, ghost
