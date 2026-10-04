# Excalidraw as the engine, behind tablo's own chrome

tablo embeds Excalidraw (MIT) as its engine instead of building a canvas engine, because v1's whole element set, the infinite canvas, undo and export come with it, and tldraw's SDK is not free for a product. Excalidraw's own toolbar and menus are hidden and replaced by tablo's chrome, with clean strokes and a restricted palette by default, because the UI is what tablo competes on and shipping Excalidraw's would make it Excalidraw.

## Consequences

- The scene format is Excalidraw's. Saved boards and any later sync protocol depend on it.
- The chrome drives the engine only through its public API. Where the API has no hook, the gap is isolated in one adapter module, not spread through the chrome.
- There is no dedicated sticky-note element: a sticky note is a filled rectangle with bound text. The image tool is switched off.
