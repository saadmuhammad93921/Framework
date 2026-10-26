import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env', '.env.secrets'], quiet: true });

export default defineConfig({
  testDir: './data/outputs/4-automation',
  outputDir: './data/outputs/4-automation/.results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'data/outputs/4-automation/.report', open: 'never' }]],
  // Each test gets a fresh browser context (storageState is reloaded, so the app's offline-first
  // local DB re-syncs from scratch every time, over a live websocket, before any record form can
  // open) - against the live QA environment that full re-sync, plus the dialogs' own "Loading..."
  // gate while it completes, needs far more than the 30s/5s defaults.
  timeout: 120000,
  expect: { timeout: 20000 },
  use: {
    baseURL: process.env.APP_URL,
    testIdAttribute: 'data-testid',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
