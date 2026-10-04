# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

tablo is a minimal, real-time collaborative whiteboard for sketching ideas, diagrams and flows in the browser.

## Commands

pnpm is not installed globally on this machine; run it through corepack (`corepack pnpm <script>`).

- `pnpm dev`: Vite dev server.
- `pnpm build`: typecheck, then production build.
- `pnpm typecheck`: `tsc --noEmit`.
- `pnpm lint`: ESLint, then Prettier check. `pnpm format` writes Prettier fixes.
- `pnpm test`: Vitest unit tests (`src/**/*.test.ts`). One file: `pnpm test src/path/file.test.ts`. One test: add `-t "name"`.
- `pnpm test:e2e`: Playwright browser tests in `e2e/`, which start their own dev server on port 5183. One file: `pnpm test:e2e e2e/canvas.spec.ts`. One test: add `-g "name"`.

## Architecture

Milestone 1 is a single-user whiteboard that runs entirely in the browser: no server, no accounts. The spec is GitHub issue #2. Use the vocabulary in `GLOSSARY.md`, and read `docs/adr/` before changing the engine or storage.

- **Engine adapter (`src/engine/`)**: the only code allowed to import Excalidraw (ADR 0001); ESLint enforces this with `no-restricted-imports`. `engine.ts` defines the `Engine` interface the rest of the app depends on, `EngineCanvas.tsx` renders the canvas and builds an `Engine` from Excalidraw's imperative API, and `engine.css` hides Excalidraw's own UI. Where Excalidraw has no public hook, the workaround belongs here.
- **Chrome**: tablo's own controls around the canvas, written against `Engine`.
- **Testing**: most behaviour lives in a canvas, so the main seam is the running app in Playwright. `e2e/board.ts` holds the helpers; tests read the scene through the dev-only `window.__tablo` hook and otherwise use accessible roles and names. Props passed to Excalidraw must be referentially stable, or React loops on updates.

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
