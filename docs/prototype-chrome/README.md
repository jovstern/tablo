# PROTOTYPE: tablo chrome variants

Throwaway code. It answers one question for spec #2: what should tablo's chrome look like, and can it drive Excalidraw with the engine's own UI hidden?

Run `pnpm install && pnpm dev`, then open `/?variant=A`, `B` or `C` (or use the pink switcher, or Alt+Left / Alt+Right).

- **A, Dock** (`a-dock.png`): everything floats; tools in a pill at the bottom centre, style bar above it only while it is relevant.
- **B, Rail** (`b-rail.png`): a fixed rail on the left edge, style in a flyout.
- **C, Bar** (`c-bar-dark.png`): one slim bar across the top with everything inline.

The verdict and the engine findings are recorded on issue #2.
