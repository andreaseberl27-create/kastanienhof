// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Smoke: Seiten laden', () => {

  test('Landing Page lädt und hat korrekten Titel', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ripelog/);
  });

  test('Admin-Panel lädt ohne JS-Fehler', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('config.js liefert gültige Supabase-URL', async ({ page }) => {
    await page.goto('/ernte-app.html');
    await page.waitForLoadState('domcontentloaded');

    const supabaseUrl = await page.evaluate(() => window.RIPELOG_CONFIG?.supabaseUrl);
    expect(supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co/);
  });

  test('config.js liefert gültigen Supabase-Key', async ({ page }) => {
    await page.goto('/ernte-app.html');
    await page.waitForLoadState('domcontentloaded');

    const key = await page.evaluate(() => window.RIPELOG_CONFIG?.supabaseKey);
    expect(key).toBeTruthy();
    expect(key.length).toBeGreaterThan(20);
  });

  test('Ernte-App zeigt Login-Overlay beim ersten Aufruf', async ({ page }) => {
    await page.goto('/ernte-app.html');
    await expect(page.locator('#loginOverlay')).toBeVisible();
  });

  test('Admin-Panel zeigt Login-Formular beim ersten Aufruf', async ({ page }) => {
    await page.goto('/admin.html');
    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#loginUser')).toBeVisible();
    await expect(page.locator('#loginPass')).toBeVisible();
  });

  test('Service Worker ist registriert', async ({ page }) => {
    await page.goto('/ernte-app.html');
    await page.waitForLoadState('networkidle');

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration('/');
      return !!reg;
    });
    expect(swRegistered).toBe(true);
  });

});
