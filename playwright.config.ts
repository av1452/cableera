import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run against the production build. External media
// (Wikimedia, YouTube) is stubbed in tests/helpers.ts so results don't depend
// on third-party rate limits.
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
  },
})
