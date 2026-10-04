# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

tablo is a minimal, real-time collaborative whiteboard for sketching ideas, diagrams and flows in the browser.

## Commands

pnpm is not installed globally on this machine; run it through corepack (`corepack pnpm <script>`).

- `pnpm dev`: Vite dev server, which also starts the relay on port 5174 (`RELAY_PORT` to change it). `pnpm relay` runs the relay alone.
- `pnpm build`: typecheck, then production build.
- `pnpm typecheck`: `tsc --noEmit`.
- `pnpm lint`: ESLint, then Prettier check. `pnpm format` writes Prettier fixes.
- `pnpm test`: Vitest unit tests (`src/**/*.test.ts`). One file: `pnpm test src/path/file.test.ts`. One test: add `-t "name"`.
- `pnpm test:e2e`: Playwright browser tests in `e2e/`, which start their own dev server on port 5183. One file: `pnpm test:e2e e2e/canvas.spec.ts`. One test: add `-g "name"`.

## Architecture

Milestone 1 is a single-user whiteboard that runs entirely in the browser: no server, no accounts. The spec is GitHub issue #2. Use the vocabulary in `GLOSSARY.md`, and read `docs/adr/` before changing the engine or storage.

- **Engine adapter (`src/engine/`)**: the only code allowed to import Excalidraw (ADR 0001); ESLint enforces this with `no-restricted-imports`.
  - `engine.ts` is the `Engine` interface and its types. Everything else in the app depends on this and nothing more.
  - `excalidrawEngine.ts` implements `Engine` on Excalidraw's imperative API. Workarounds for what that API lacks live here and nowhere else: undo and redo press Excalidraw's own hidden buttons, their availability is read from those buttons' `disabled` state, and a sticky note's text editor is opened by sending Enter.
  - `EngineCanvas.tsx` renders the canvas, pins Excalidraw's view and zen modes off, and swallows the shortcuts that open Excalidraw's own dialogs. Props passed to Excalidraw must be referentially stable, or React loops on updates.
  - `useEngineState.ts` exposes `Engine.state()` to React as an external store. The engine subscribes to Excalidraw only while someone listens, because Excalidraw drops its subscribers when StrictMode unmounts it once.
  - `engine.css` hides Excalidraw's own UI (the wide layout, the narrow layout it switches to below about 730px, and its right-click menu) and defines the colour filter of a dark canvas.
- **Chrome (`src/chrome/`)**: tablo's own controls, floating over the canvas in the Dock layout and written against `Engine`. `palette.ts` is the only source of the colours and widths the chrome offers; they are stored as light-theme values and filtered for display in dark mode. Buttons use `keepCanvasFocus` so a click never takes keyboard focus from the canvas.
- **Boards (`src/boards/`)**: ids, the `BoardStore` interface with its localStorage implementation (ADR 0002), and `useAutosave`, which is the first subscriber to `Engine.onSceneChange` (a relay would be the second). `save` returns failure as a value; a full quota surfaces as a warning in the chrome and nothing is ever evicted.
- **Relay (`relay/`)**: a stateless Node websocket server with one room per board id (ADR 0002, 0003). It forwards frames and never reads their bodies; the wire format is documented at the top of `relay/relay.ts`. The browser finds it through `VITE_RELAY_URL`, defaulting to port 5174 on the page's host.
- **Sync (`src/sync/`)**: `boardSync.ts` is the second subscriber to `Engine.onSceneChange`. It sends elements whose version the others do not have yet and merges what they send with `Engine.applyRemoteElements` (last writer wins per element). Tracking shared versions is also what stops a received change from being sent back. Whole scenes, tombstones included, are exchanged whenever someone joins or a connection comes back, which is the only resync mechanism. It also carries presence (identity, pointer, selection) and reports connection state to the chrome through `useBoardSync`. `identity.ts` gives each browser a name and a colour key once.
- **Participant colours**: Excalidraw derives a cursor's colour from the id it is given and cannot be told a colour, so `src/engine/participantColour.ts` repeats its derivation for the avatars. A browser test compares cursor pixels with the avatar.
- **Routing (`src/App.tsx`)**: `/b/<id>` is a board; anything else redirects to the recent board or a new one. `Board` is keyed by id so each board gets its own canvas.
- **Theme (`src/theme/`)**: follows the system until toggled, then remembered. It sets `dark` on `<html>` for Tailwind and is passed to the canvas.

## Testing

Most behaviour lives in a canvas that unit tests cannot see, so the main seam is the running app in Playwright (`e2e/`). `e2e/board.ts` holds the helpers; tests read the scene through the dev-only `window.__tablo` hook and otherwise use accessible roles and names, which only find tablo's controls because Excalidraw's are `display: none`. Collaboration is tested with two browser contexts on one board (`twoParticipants` in `e2e/board.ts`); the test run's dev server starts its own relay on port 5185. The second seam is `BoardStore`, unit-tested with `fakeStorage`, and the third is the relay as a running server, tested with real websocket clients in `relay/relay.test.ts`. The engine adapter has no unit tests: a fake engine would only test the fake.

## MCP servers

`.mcp.json` configures two project-scoped servers:

- `github`: GitHub's hosted MCP server. It reads the token from the `GITHUB_PAT` environment variable, which must be set in the shell that launches Claude Code.
- `webstorm`: the local WebStorm IDE MCP server at `127.0.0.1:64542`. It is only reachable while WebStorm is running with this project open, and the port is specific to this machine.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on `jovstern/tablo`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels are used unchanged: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
