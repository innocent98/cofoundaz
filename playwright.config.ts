import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
webServer: {
  command: 'npm run start', // or 'npm run dev', 'npm run build && npm run start'
  port: 3000,
  reuseExistingServer: !process.env.CI,
},
})
