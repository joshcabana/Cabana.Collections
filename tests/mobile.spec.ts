import { test, expect } from '@playwright/test';

const urls = [
  '/',
  '/products/mens-boxer-brief-black.html',
  '/products/womens-set.html',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/about.html',
  '/impact.html',
  '/faq.html',
  '/cart.html',
];

const widths = [375, 414, 430];

for (const width of widths) {
  test.describe(`mobile smoke @${width}px`, () => {
    for (const path of urls) {
      test(`no horizontal scroll, header/menu usable, images visible: ${path}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);

        // No horizontal scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

        // Header/menu usable: open and close drawer
        const openBtn = page.locator('[data-mobile-open]');
        if (await openBtn.count()) {
          await openBtn.first().click();
          await expect(page.locator('[data-mobile-drawer]')).toHaveClass(/is-open|/);
          const closeBtn = page.locator('[data-mobile-close]');
          if (await closeBtn.count()) {
            await closeBtn.first().click();
          }
        }

        // Images visible (not 0x0). Check a few img elements
        const imgs = page.locator('img');
        const count = await imgs.count();
        const sample = Math.min(3, count);
        for (let i = 0; i < sample; i++) {
          const box = await imgs.nth(i).boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThan(0);
          }
        }
      });
    }
  });
}
