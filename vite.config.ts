import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    include: ['src/**/*.test.ts'],
  },
})
