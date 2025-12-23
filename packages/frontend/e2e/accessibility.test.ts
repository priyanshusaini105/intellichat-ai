import { expect, test } from '@playwright/test';

test.describe('Accessibility - ARIA and Keyboard', () => {
	test('floating button has proper ARIA label', async ({ page }) => {
		await page.goto('/');
		const button = page.getByRole('button', { name: /open support widget/i });
		await expect(button).toHaveAttribute('aria-label', 'Open support widget');
	});

	test('can navigate with keyboard', async ({ page }) => {
		await page.goto('/');

		// Focus floating button and open with Enter
		const button = page.getByRole('button', { name: /open support widget/i });
		await button.focus();
		await page.keyboard.press('Enter');
		await expect(page.getByText('Hey 👋, how can we help you today?')).toBeVisible();
	});
	test('touch targets are adequately sized on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		await page.getByRole('button', { name: /open support widget/i }).click();

		// Buttons should be large enough for touch
		const chatButton = page.getByRole('button', { name: /chat with us/i });
		const boundingBox = await chatButton.boundingBox();

		expect(boundingBox).toBeTruthy();
		if (boundingBox) {
			expect(boundingBox.height).toBeGreaterThanOrEqual(40);
		}
	});
});
