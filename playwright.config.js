import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'cd /home/runner/work/quocthang0507.github.io/quocthang0507.github.io && export PATH="$HOME/.local/share/gem/ruby/3.2.0/bin:$PATH" && bundle exec jekyll serve --port 4000 --host 0.0.0.0',
    port: 4000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
