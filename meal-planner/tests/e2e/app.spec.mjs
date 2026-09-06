import { test, expect } from '@playwright/test';

// Every test starts from a clean localStorage so tests don't leak state into
// each other. A page-error listener is armed before the very first
// navigation and checked after every test, so any uncaught exception on any
// page load or interaction fails that test - not just one dedicated check.
let pageErrors = [];
test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});
test.afterEach(() => {
  expect(pageErrors, `unexpected page errors: ${pageErrors.join('; ')}`).toEqual([]);
});

test.describe('app shell', () => {
  test('loads and registers the service worker', async ({ page }) => {
    await expect(page.locator('#pantry-form')).toBeVisible();

    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? (reg.active?.state ?? 'pending') : 'none';
    });
    expect(swState).not.toBe('none');
  });

  test('manifest.json is reachable and well-formed', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/manifest.json`);
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.name).toBeTruthy();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('tab navigation switches panels', async ({ page }) => {
    await page.click('.tab-btn[data-tab=plan]');
    await expect(page.locator('[data-panel=plan]')).toBeVisible();
    await expect(page.locator('[data-panel=pantry]')).toBeHidden();

    await page.click('.tab-btn[data-tab=shopping]');
    await expect(page.locator('[data-panel=shopping]')).toBeVisible();
  });
});

test.describe('pantry', () => {
  test('add, edit, and delete a pantry item', async ({ page }) => {
    await page.fill('#pantry-name', 'עגבניות');
    await page.fill('#pantry-qty', '3');
    await page.click('#pantry-form button[type=submit]');
    await expect(page.locator('#pantry-list')).toContainText('עגבניות');
    await expect(page.locator('#pantry-list')).toContainText('3 יח');

    await page.click('#pantry-list button[aria-label="ערוך"]');
    await page.fill('#modal-body input[type=number]', '5');
    await page.click('#modal-body button[type=submit]');
    await expect(page.locator('#pantry-list')).toContainText('5 יח');

    await page.click('#pantry-list button[aria-label="מחק"]');
    await expect(page.locator('#pantry-empty')).toBeVisible();
  });

  test('the "what can I make" button sits above the pantry list, not below it', async ({ page }) => {
    // Regression: it used to live after #pantry-list, which pushed it out of
    // reach once the list grew long. It must now come before the form/list.
    const order = await page.evaluate(() => {
      const btn = document.querySelector('#pantry-suggest-btn');
      const list = document.querySelector('#pantry-list');
      return btn.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING ? 'btn-before-list' : 'other';
    });
    expect(order).toBe('btn-before-list');
  });
});

test.describe('meal planning', () => {
  test('adding a known dish auto-fills its ingredients', async ({ page }) => {
    await page.click('.tab-btn[data-tab=plan]');
    await page.fill('#meal-name', 'שניצל');
    await page.click('#meal-form button[type=submit]');
    await expect(page.locator('#meal-list')).toContainText('שניצל');
    await expect(page.locator('#meal-list')).toContainText('Schnitzel');
    await expect(page.locator('#modal-overlay')).toBeHidden(); // no manual-entry prompt needed
  });

  test('an unrecognized dish opens the manual ingredient editor', async ({ page }) => {
    await page.click('.tab-btn[data-tab=plan]');
    await page.fill('#meal-name', 'מנה שלא קיימת בבנק המתכונים');
    await page.click('#meal-form button[type=submit]');
    await expect(page.locator('#modal-overlay')).toBeVisible();
    await page.fill('#modal-body [data-row] input[placeholder="שם רכיב"]', 'מרכיב לדוגמה');
    await page.fill('#modal-body [data-row] input[type=number]', '2');
    await page.click('#modal-body button[type=submit]');
    await expect(page.locator('#meal-list')).toContainText('1 רכיבים');
  });

  test('meal-type chip filters the recipe datalist to matching dishes', async ({ page }) => {
    await page.click('.tab-btn[data-tab=plan]');
    await page.locator('#mealtype-chips button', { hasText: 'בוקר' }).click();
    const options = await page.$$eval('#recipe-suggestions option', (els) => els.map((e) => e.value));
    expect(options).toContain('חביתת ירקות');
    expect(options).not.toContain('שניצל');
  });
});

test.describe('shopping list', () => {
  test('aggregates ingredients and subtracts what is already in the pantry', async ({ page }) => {
    await page.fill('#pantry-name', 'ביצים');
    await page.fill('#pantry-qty', '2');
    await page.click('#pantry-form button[type=submit]');

    await page.click('.tab-btn[data-tab=plan]');
    await page.fill('#meal-name', 'שניצל'); // needs 3 ביצים
    await page.click('#meal-form button[type=submit]');

    await page.click('.tab-btn[data-tab=shopping]');
    const row = page.locator('#shopping-list label', { hasText: 'ביצים' });
    await expect(row).toContainText('1 יח'); // 3 needed - 2 in pantry = 1
  });

  test('checking an item off persists after re-render', async ({ page }) => {
    await page.click('.tab-btn[data-tab=plan]');
    await page.fill('#meal-name', 'חומוס');
    await page.click('#meal-form button[type=submit]');
    await page.click('.tab-btn[data-tab=shopping]');

    const checkbox = page.locator('#shopping-list input[type=checkbox]').first();
    await checkbox.check();
    await page.click('.tab-btn[data-tab=plan]');
    await page.click('.tab-btn[data-tab=shopping]');
    await expect(page.locator('#shopping-list input[type=checkbox]').first()).toBeChecked();
  });
});

test.describe('pantry-based suggestions', () => {
  async function addPantry(page, name, qty, unit) {
    await page.fill('#pantry-name', name);
    await page.fill('#pantry-qty', String(qty));
    if (unit) await page.selectOption('#pantry-unit', unit);
    await page.click('#pantry-form button[type=submit]');
  }

  test('a fully-stocked recipe shows the full-match badge and can be added with a day', async ({ page }) => {
    await addPantry(page, 'ביצים', 10, 'יחידה');
    await addPantry(page, 'עגבניות מרוסקות', 900, 'גרם');
    await addPantry(page, 'בצל', 3, 'יחידה');
    await addPantry(page, 'פלפל אדום', 2, 'יחידה');
    await addPantry(page, 'שום', 5, 'שן');
    await addPantry(page, 'פפריקה', 2, 'כפית');
    await addPantry(page, 'כמון', 2, 'כפית');
    await addPantry(page, 'מלח', 2, 'כפית');
    await addPantry(page, 'לחם', 2, 'יחידה');

    await page.click('#pantry-suggest-btn');
    const shakshukaRow = page.locator('#modal-body label', { hasText: 'שקשוקה' }).first();
    await expect(shakshukaRow).toContainText('יש לכם הכל');
    await shakshukaRow.locator('input[type=checkbox]').check();
    await page.click('#modal-body button[type=submit]');

    await expect(page.locator('#modal-body')).toContainText('באיזה יום');
    await page.locator('#modal-body button', { hasText: 'שני' }).first().click();
    await page.click('#modal-body button[type=submit]');

    await expect(page.locator('[data-panel=plan]')).toBeVisible();
    await expect(page.locator('#meal-list')).toContainText('שקשוקה');
    await expect(page.locator('#meal-list')).toContainText('שני');
  });

  test('an empty pantry shows a toast instead of an empty modal', async ({ page }) => {
    await page.click('#pantry-suggest-btn');
    await expect(page.locator('#modal-overlay')).toBeHidden();
    await expect(page.locator('#toast')).toHaveClass(/toast-show/);
  });
});

test.describe('AI recipe lookup (mocked)', () => {
  test('settings modal saves and clears the API key', async ({ page }) => {
    await page.click('#ai-settings-btn');
    await page.fill('#modal-body input[type=password]', 'sk-ant-test-key');
    await page.click('#modal-body button[type=submit]');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mealPlanner.aiApiKey.v1') || '""'));
    expect(saved).toBe('sk-ant-test-key');

    await page.click('#ai-settings-btn');
    await page.click('#modal-body button:has-text("הסר מפתח")');
    const cleared = await page.evaluate(() => JSON.parse(localStorage.getItem('mealPlanner.aiApiKey.v1') || '""'));
    expect(cleared).toBe('');
  });

  test('an unrecognized dish is filled in from a mocked Anthropic response', async ({ page }) => {
    await page.click('#ai-settings-btn');
    await page.fill('#modal-body input[type=password]', 'sk-ant-test-key');
    await page.click('#modal-body button[type=submit]');

    await page.route('https://api.anthropic.com/v1/messages', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{
          type: 'text',
          text: JSON.stringify({
            nameHe: 'פשטידת תרד', nameEn: 'Spinach Pie',
            ingredients: [
              { name: 'תרד', quantity: 2, unit: 'כוס' },
              { name: 'ביצים', quantity: 4, unit: 'יחידה' },
              { name: 'קמח', quantity: 1, unit: 'כוס' },
            ],
          }),
        }],
      }),
    }));

    await page.click('.tab-btn[data-tab=plan]');
    await page.fill('#meal-name', 'פשטידת תרד');
    await page.click('#meal-form button[type=submit]');

    await expect(page.locator('#meal-list')).toContainText('פשטידת תרד', { timeout: 10000 });
    await expect(page.locator('#meal-list')).toContainText('3 רכיבים');
    await expect(page.locator('#modal-overlay')).toBeHidden(); // AI succeeded, no manual fallback

    await page.click('.tab-btn[data-tab=shopping]');
    await expect(page.locator('#shopping-list')).toContainText('תרד');
  });

  test('a failed AI call falls back to the manual ingredient editor', async ({ page }) => {
    await page.click('#ai-settings-btn');
    await page.fill('#modal-body input[type=password]', 'sk-ant-test-key');
    await page.click('#modal-body button[type=submit]');

    await page.route('https://api.anthropic.com/v1/messages', (route) => route.fulfill({ status: 500, body: 'error' }));

    await page.click('.tab-btn[data-tab=plan]');
    await page.fill('#meal-name', 'מנה שהבינה המלאכותית תיכשל עליה');
    await page.click('#meal-form button[type=submit]');

    await expect(page.locator('#modal-overlay')).toBeVisible({ timeout: 10000 });
  });
});
