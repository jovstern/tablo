import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { DEFAULT_RELAY_PORT } from './relay/frame.ts'
import { startRelay } from './relay/relay.ts'

/** Runs the relay beside the dev server, so `pnpm dev` is all collaboration needs locally. */
function relay(): Plugin {
  return {
    name: 'tablo-relay',
    apply: 'serve',
    async configureServer(server) {
      // Vitest starts a dev server of its own, which has no use for a relay.
      if (process.env.VITEST) return
      const port = Number(process.env.RELAY_PORT ?? DEFAULT_RELAY_PORT)
      try {
        const running = await startRelay({ port })
        server.config.logger.info(`  ➜  Relay:   ws://localhost:${running.port}`)
        server.httpServer?.once('close', () => void running.close())
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw error
        // Most likely another dev server already runs a relay there, which will do.
        server.config.logger.warn(`  ➜  Relay:   not started, port ${port} is in use`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), relay()],
  optimizeDeps: {
    // Pre-bundle up front. Discovering these on first load can make the dev server
    // reload the page mid-run, which would fail browser tests on a cold cache.
    include: [
      '@excalidraw/excalidraw',
      'lucide-react',
      'react',
      'react-dom/client',
      'react-router',
    ],
  },
  test: {
    include: ['src/**/*.test.ts', 'relay/**/*.test.ts'],
  },
})
