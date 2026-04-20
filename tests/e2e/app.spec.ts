import { test, expect } from '@playwright/test';

test.describe('E2E: Přihlášení a ochrana rout (Kapitola 6.3.1)', () => {

    test('Nepřihlášený uživatel je přesměrován na login', async ({ page }) => {
        // Pokus o přístup na chráněnou stránku
        await page.goto('/watchlist');

        // Playwright asertuje auto-waitingem, že proběhlo přesměrování
        await expect(page).toHaveURL(/.*\/sign-in/);
    });

    test('Úspěšné přihlášení uživatele', async ({ page }) => {
        await page.goto('/sign-in');

        // Vyplnění formuláře
        await page.fill('input[type="email"]', 'test@example.com'); // Změň na svůj testovací mail
        await page.fill('input[type="password"]', 'Heslo123!');
        await page.click('button[type="submit"]');

        // Ověření úspěšného vstupu do aplikace
        await expect(page).toHaveURL('/watchlist');
        await expect(page.locator('text=Odhlásit se')).toBeVisible();
    });
});

test.describe('E2E: Správa watchlistu a alertů (Kapitola 6.3.2)', () => {
    // Tento blok předpokládá, že uživatel je přihlášený (dá se řešit přes Playwright global setup)
    test.use({ storageState: 'playwright/.auth/user.json' }); // Udržuje přihlášení

    test('Přidání akcie do watchlistu', async ({ page }) => {
        await page.goto('/watchlist');

        // Kliknutí na přidání, vyhledání a potvrzení
        await page.fill('input[placeholder="Vyhledat symbol..."]', 'AAPL');
        await page.click('button:has-text("Přidat")');

        // Aserce DOM stromu - symbol musí být v seznamu
        const stockItem = page.locator('.watchlist-item', { hasText: 'AAPL' });
        await expect(stockItem).toBeVisible();
    });

    test('Vytvoření alertu s úspěšnou notifikací', async ({ page }) => {
        await page.goto('/alerts');

        // Vyplnění formuláře pro alert
        await page.click('button:has-text("Nový Alert")');
        await page.fill('input[name="symbol"]', 'MSFT');
        await page.selectOption('select[name="condition"]', 'upper');
        await page.fill('input[name="threshold"]', '450');
        await page.click('button:has-text("Uložit")');

        // Aserce úspěšné potvrzovací zprávy (Toast) a přítomnosti v seznamu
        await expect(page.locator('text=Alert úspěšně vytvořen')).toBeVisible();
        await expect(page.locator('.alert-item', { hasText: 'MSFT' })).toBeVisible();
    });
});