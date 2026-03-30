// @ts-check
const { test, expect } = require('@playwright/test');

const EMAIL    = process.env.TEST_EMAIL    || 'andi_eberl@gmx.de';
const PASSWORD = process.env.TEST_PASSWORD || 'testtest';

test.describe('Login: Ernte-App', () => {

  test('Erfolgreich einloggen', async ({ page }) => {
    await page.goto('/ernte-app.html');
    await expect(page.locator('#loginOverlay')).toBeVisible();

    await page.fill('#loginUsername', EMAIL);
    await page.fill('#loginPassword', PASSWORD);
    await page.click('#loginBtn');

    // Login-Overlay muss verschwinden
    await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 10_000 });
    // Haupt-Navigation muss sichtbar sein
    await expect(page.locator('.nav-tabs')).toBeVisible();
  });

  test('Fehlermeldung bei falschem Passwort', async ({ page }) => {
    await page.goto('/ernte-app.html');

    await page.fill('#loginUsername', EMAIL);
    await page.fill('#loginPassword', 'falschespasswort123');
    await page.click('#loginBtn');

    await expect(page.locator('#loginError')).toBeVisible({ timeout: 10_000 });
    // Overlay bleibt offen
    await expect(page.locator('#loginOverlay')).toBeVisible();
  });

  test('Login-Button per Enter-Taste auslösbar', async ({ page }) => {
    await page.goto('/ernte-app.html');

    await page.fill('#loginUsername', EMAIL);
    await page.fill('#loginPassword', PASSWORD);
    await page.locator('#loginPassword').press('Enter');

    await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 10_000 });
  });

});

test.describe('Login: Admin-Panel', () => {

  test('Erfolgreich einloggen', async ({ page }) => {
    await page.goto('/admin.html');
    await expect(page.locator('#loginPage')).toBeVisible();

    await page.fill('#loginUser', EMAIL);
    await page.fill('#loginPass', PASSWORD);
    await page.click('#loginBtn');

    // App-Shell muss erscheinen
    await expect(page.locator('#appPage')).toBeVisible({ timeout: 10_000 });
    // Login-Seite muss verschwinden
    await expect(page.locator('#loginPage')).toBeHidden();
  });

  test('Fehlermeldung bei falschem Passwort', async ({ page }) => {
    await page.goto('/admin.html');

    await page.fill('#loginUser', EMAIL);
    await page.fill('#loginPass', 'falschespasswort123');
    await page.click('#loginBtn');

    await expect(page.locator('#loginErr')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#loginPage')).toBeVisible();
  });

});
