// @ts-check
const { test, expect } = require('@playwright/test');

const EMAIL    = process.env.TEST_EMAIL    || 'andi_eberl@gmx.de';
const PASSWORD = process.env.TEST_PASSWORD || 'testtest';

// ── Hilfsfunktion: Login ──────────────────────────────────────────────────
async function login(page) {
  await page.goto('/ernte-app.html');
  await page.fill('#loginUsername', EMAIL);
  await page.fill('#loginPassword', PASSWORD);
  await page.click('#loginBtn');
  await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 10_000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────
test.describe('Ernte-App: Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Erfassung-Tab ist nach Login aktiv', async ({ page }) => {
    await expect(page.locator('#page-erfassung')).toBeVisible();
    await expect(page.locator('#tab-erfassung')).toHaveClass(/active/);
  });

  test('Protokoll-Tab öffnet Protokoll-Seite', async ({ page }) => {
    await page.click('#tab-protokoll');
    await expect(page.locator('#page-protokoll')).toBeVisible();
    await expect(page.locator('#page-erfassung')).toBeHidden();
  });

  test('Statistik-Tab öffnet Statistik-Seite', async ({ page }) => {
    await page.click('#tab-statistik');
    await expect(page.locator('#page-statistik')).toBeVisible();
  });

  test('Einstellungen-Tab öffnet Einstellungen-Seite', async ({ page }) => {
    await page.click('#tab-einstellungen');
    await expect(page.locator('#page-einstellungen')).toBeVisible();
  });

});

test.describe('Ernte-App: Schicht-Setup', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Context-Strip öffnet Setup-Dialog', async ({ page }) => {
    await page.click('#ctxStrip');
    await expect(page.locator('#setupOverlay')).not.toHaveClass(/hidden/);
  });

  test('Setup-Dialog enthält Stammdaten aus Supabase', async ({ page }) => {
    await page.click('#ctxStrip');
    // Warten bis setupContent befüllt ist (Supabase-Call)
    await expect(page.locator('#setupContent')).not.toBeEmpty({ timeout: 8_000 });
  });

});

test.describe('Ernte-App: Manuelle Erfassung', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Ohne Schicht öffnet manuell-erfassen den Setup-Dialog', async ({ page }) => {
    // Korrekte Behavior: ohne eingerichtete Schicht → Setup-Overlay statt Manual-Overlay
    await page.click('button:has-text("manuell erfassen")');
    await expect(page.locator('#setupOverlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#manualOverlay')).toHaveClass(/hidden/);
  });

});
