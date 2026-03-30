// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * TEST_BASE_URL: URL der zu testenden Umgebung.
 *   lokal:    TEST_BASE_URL=http://localhost:8888 npm test
 *   INT:      TEST_BASE_URL=https://develop--<site>.netlify.app npm test
 *   Netlify:  Wird als Env-Variable im Netlify-UI gesetzt (PLAYWRIGHT_BASE_URL)
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.TEST_BASE_URL;

if (!baseURL) {
  console.error('ERROR: PLAYWRIGHT_BASE_URL ist nicht gesetzt. Beispiel:');
  console.error('  TEST_BASE_URL=https://deine-site.netlify.app npm test');
  process.exit(1);
}

module.exports = defineConfig({
  testDir: '.',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // sequentiell – weniger Supabase-Last

  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'de-DE',
  },

  reporter: [
    ['line'],
    ['html', { outputFolder: 'test-report', open: 'never' }],
  ],
});
