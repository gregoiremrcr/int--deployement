import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node node_modules/tsx/dist/cli.mjs backend/index.ts',
      url: 'http://127.0.0.1:8787/health',
      reuseExistingServer: !process.env.CI,
      env: { WISHLIST_STORAGE: 'memory' },
    },
    {
      command: 'node node_modules/nuxt/bin/nuxt.mjs dev --host 127.0.0.1',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
      env: {
        NUXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8787',
        NUXT_PUBLIC_POKE_API_BASE_URL: 'http://127.0.0.1:8787/__test/pokemon',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
