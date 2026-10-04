# tablo

A minimal whiteboard for sketching ideas, diagrams and flows in the browser. Real-time collaboration is planned; milestone 1 is single-user.

Open it and you are on a board: no sign-up, nothing to choose. Boards save themselves in your browser and each has its own URL.

## What is in milestone 1

- An infinite canvas with rectangles, ellipses, arrows that stay attached, a pen, text and sticky notes.
- A small fixed palette, clean strokes, undo and redo, zoom, and light and dark themes.
- PNG and SVG export.
- Autosave to the browser's storage. Nothing leaves your machine, and there is no server.

## Run it

Requires Node 24 and pnpm (via `corepack enable`, or prefix the commands with `corepack`).

```sh
pnpm install
pnpm dev
```

## Check it

```sh
pnpm lint        # ESLint and Prettier
pnpm typecheck
pnpm test        # unit tests
pnpm test:e2e    # browser tests (first run: pnpm exec playwright install chromium)
```

## How it is put together

The canvas is [Excalidraw](https://github.com/excalidraw/excalidraw), embedded behind tablo's own controls. `CLAUDE.md` describes the architecture, `GLOSSARY.md` the vocabulary, and `docs/adr/` the decisions that are hard to reverse.
