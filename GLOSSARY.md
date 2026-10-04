# tablo

A whiteboard in the browser for sketching ideas, diagrams and flows, chosen for speed, simplicity and its UI.

## Language

**Board**:
One whiteboard, identified by an unguessable id and reachable at its own URL.
_Avoid_: Room, document, drawing, file

**Canvas**:
The infinite surface of a board that elements are drawn on and that the viewer pans and zooms.
_Avoid_: Stage, viewport, whiteboard

**Element**:
A single thing on the canvas: a rectangle, ellipse, arrow, pen stroke, text or sticky note.
_Avoid_: Shape, object, node

**Sticky note**:
A filled rectangle with text bound inside it, offered as its own tool.
_Avoid_: Note, post-it, card

**Scene**:
The full set of elements on a board at one moment. It is what gets saved and exported.
_Avoid_: State, content, snapshot

**Engine**:
The embedded canvas library that draws the scene and handles pointer and keyboard input on the canvas.
_Avoid_: Renderer, editor

**Chrome**:
Every control tablo draws around the canvas: tool bar, style popover, history, zoom, export, theme toggle and new-board button.
_Avoid_: UI, toolbar (for the whole), shell

**Tool**:
The mode that decides what a drag on the canvas does: select, or create one kind of element.
_Avoid_: Mode, brush

**Palette**:
The small fixed set of stroke and fill colours the chrome offers.
_Avoid_: Colour picker, swatches

**Board store**:
The place a board's scene is saved and loaded from. In milestone 1 it is the browser's own storage.
_Avoid_: Database, persistence layer, backend

**Recent board**:
The board this browser opened last, which the root URL reopens.
_Avoid_: Last board, default board, home board
