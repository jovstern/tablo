# Boards live in the browser; no server in milestone 1

A board's scene is saved only in the browser that edited it (localStorage for now), and milestone 1 has no server, no accounts and no collaboration. This was chosen to ship a single-user whiteboard with no infrastructure. When collaboration arrives the plan is a stateless relay with each participant still holding their own copy, so a shared link opens empty when nobody else is online.

## Consequences

- Every save goes through the board store interface and every scene change through one change-event interface, so IndexedDB and a relay can be added later without touching the chrome.
- localStorage caps at about 5 MB per origin across all boards. When it is full, tablo warns that saving has stopped and offers export; it never deletes boards silently.
- Board ids are unguessable because, once a relay exists, the link is the only access control.
