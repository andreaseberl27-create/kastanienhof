// @ts-check
const { test, expect } = require('@playwright/test');

const EMAIL    = process.env.TEST_EMAIL    || 'andi_eberl@gmx.de';
const PASSWORD = process.env.TEST_PASSWORD || 'testtest';

// ── Hilfsfunktion: Login ──────────────────────────────────────────────────
async function login(page) {
  await page.goto('/admin.html');
  await page.fill('#loginUser', EMAIL);
  await page.fill('#loginPass', PASSWORD);
  await page.click('#loginBtn');
  await expect(page.locator('#appPage')).toBeVisible({ timeout: 10_000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────
test.describe('Admin: Shell & Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Sidebar mit allen Nav-Items ist sichtbar', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
    // Mindestens 5 Navigationspunkte erwartet
    const count = await page.locator('.nav-item').count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('Mitarbeiter-Sektion lädt als Standard', async ({ page }) => {
    await expect(page.locator('#nav-mitarbeiter')).toHaveClass(/active/);
    // Tabelle muss befüllt oder "leer"-Hinweis zeigen
    await expect(page.locator('#tableContainer')).not.toBeEmpty({ timeout: 8_000 });
  });

  test('Navigation zu Felder funktioniert', async ({ page }) => {
    await page.click('#nav-felder');
    await expect(page.locator('#nav-felder')).toHaveClass(/active/);
    await expect(page.locator('#tableContainer')).not.toBeEmpty({ timeout: 8_000 });
  });

  test('Navigation zu Sorten funktioniert', async ({ page }) => {
    await page.click('#nav-sorten');
    await expect(page.locator('#nav-sorten')).toHaveClass(/active/);
    await expect(page.locator('#tableContainer')).not.toBeEmpty({ timeout: 8_000 });
  });

  test('Navigation zu Protokoll funktioniert', async ({ page }) => {
    await page.click('#nav-protokoll');
    await expect(page.locator('#nav-protokoll')).toHaveClass(/active/);
    await expect(page.locator('#tableContainer')).not.toBeEmpty({ timeout: 8_000 });
  });

  test('Navigation zu Auswertung funktioniert', async ({ page }) => {
    await page.click('#nav-auswertung');
    await expect(page.locator('#nav-auswertung')).toHaveClass(/active/);
    await expect(page.locator('#tableContainer')).not.toBeEmpty({ timeout: 8_000 });
  });

});

test.describe('Admin: Stammdaten vorhanden', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Mitarbeiter-Liste hat mindestens einen Eintrag', async ({ page }) => {
    await expect(page.locator('#nav-mitarbeiter')).toHaveClass(/active/);
    await expect(page.locator('#tableContainer tbody tr')).not.toHaveCount(0, { timeout: 8_000 });
    // Kein "leer"-Platzhalter-Eintrag (colspan=...)
    const emptyRow = page.locator('#tableContainer td[colspan]');
    await expect(emptyRow).toHaveCount(0);
  });

});
