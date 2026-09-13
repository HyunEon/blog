import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm exec wrangler d1 migrations apply DB --local --persist-to .wrangler/test && pnpm dev --port 3100',
    url: 'http://127.0.0.1:3100',
    env: { BLOG_DEV_TOKEN: 'local-e2e-token', BLOG_D1_STATE: '.wrangler/test/v3', NUXT_TELEMETRY_DISABLED: '1' },
    reuseExistingServer: false,
    timeout: 120000,
  },
})
