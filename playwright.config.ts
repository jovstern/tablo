import { defineConfig, devices } from '@playwright/test'

const PORT = 5183
const RELAY_PORT = 5185

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The dev server starts the relay too; give both ports of their own for tests.
    command: `vite --port ${PORT} --strictPort`,
    env: { RELAY_PORT: String(RELAY_PORT), VITE_RELAY_URL: `ws://localhost:${RELAY_PORT}` },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
