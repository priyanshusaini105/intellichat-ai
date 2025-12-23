import { expect, test } from '@playwright/test';

test.describe('Chat Widget - Basic Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('home page loads successfully', async ({ page }) => {
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toContainText('Spur Support chatbot widget');
	});

	test('chat widget button is visible on page load', async ({ page }) => {
		const chatButton = page.getByRole('button', { name: /open support widget/i });
		await expect(chatButton).toBeVisible();
	});

	test('clicking chat button opens the widget', async ({ page }) => {
		const chatButton = page.getByRole('button', { name: /open support widget/i });
		await chatButton.click();

		// Widget should be visible with welcome view
		await expect(page.getByText('Hey 👋, how can we help you today?')).toBeVisible();
	});

	test('clicking X button closes the widget', async ({ page }) => {
		// Open widget
		const chatButton = page.getByRole('button', { name: /open support widget/i });
		await chatButton.click();

		// Close widget using header X button
		const closeButton = page.getByRole('button', { name: /close widget/i });
		await closeButton.click();

		// Widget should not be visible
		await expect(page.getByText('Hey 👋, how can we help you today?')).not.toBeVisible();
	});
});

test.describe('Chat Widget - Welcome View', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /open support widget/i }).click();
	});

	test('displays welcome screen', async ({ page }) => {
		await expect(page.getByText('Hey 👋, how can we help you today?')).toBeVisible();
		await expect(page.getByRole('button', { name: /chat with us/i })).toBeVisible();
	});

	test('clicking "Chat with us" transitions to chat view', async ({ page }) => {
		await page.getByRole('button', { name: /chat with us/i }).click();

		// Should show chat view with message input
		await expect(page.locator('textarea[placeholder*="Type your message"]')).toBeVisible();
	});
});

test.describe('Chat Widget - Chat Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /open support widget/i }).click();
		await page.getByRole('button', { name: /chat with us/i }).click();
	});

	test('displays chat interface', async ({ page }) => {
		await expect(page.locator('textarea[placeholder*="Type your message"]')).toBeVisible();
		await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
	});

	test('can send a message', async ({ page }) => {
		const messageInput = page.locator('textarea[placeholder*="Type your message"]');

		// Type and send message
		await messageInput.fill('Hello, I need help');
		await page.getByRole('button', { name: /send message/i }).click();

		// User message should appear
		await expect(page.getByText('Hello, I need help')).toBeVisible();
	});

	test('can send message with Enter key', async ({ page }) => {
		const messageInput = page.locator('textarea[placeholder*="Type your message"]');

		await messageInput.fill('Testing Enter key');
		await messageInput.press('Enter');

		// Message should be sent
		await expect(page.getByText('Testing Enter key')).toBeVisible();
	});

	test('send button disabled when input is empty', async ({ page }) => {
		const sendButton = page.getByRole('button', { name: /send message/i });
		await expect(sendButton).toBeDisabled();
	});
});

test.describe('Chat Widget - Responsiveness', () => {
	test('widget works on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		const chatButton = page.getByRole('button', { name: /open support widget/i });
		await chatButton.click();
		await expect(page.getByText('Hey 👋, how can we help you today?')).toBeVisible();
	});
});
