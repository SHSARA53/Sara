import { defineConfig, devices } from '@playwright/test';

// Test-only config for a project that otherwise ships with zero build
// tooling - see README.md "בדיקות אוטומטיות" for how to run these.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // each test resets its own localStorage; keep it simple and serial
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx serve -l 4321 .',
    url: 'http://localhost:4321/index.html',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        // This project's pinned @playwright/test version may expect a newer
        // browser build than what's preinstalled in this environment -
        // launch the preinstalled one explicitly instead of downloading.
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
      },
    },
  ],
});
