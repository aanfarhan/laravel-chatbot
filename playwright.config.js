import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.CHATBOT_E2E_PORT ?? 8765)
const BASE_URL = `http://127.0.0.1:${PORT}`
const DB_PATH = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  'tests/e2e/e2e.sqlite',
)

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `vendor/bin/testbench serve --host=127.0.0.1 --port=${PORT} --no-reload`,
    url: `${BASE_URL}/chatbot/demo`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      DB_DATABASE: DB_PATH,
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
