import { expect, test } from '@playwright/test';

test.describe('User Flow - Basic Journey', () => {
test('complete flow: open widget → chat → send message', async ({ page }) => {
await page.goto('/');

// Step 1: Open widget from floating button
await page.getByRole('button', { name: /open support widget/i }).click();
await expect(page.getByText('Hey 👋, how can we help you today?')).toBeVisible();

// Step 2: Click "Chat with us"
await page.getByRole('button', { name: /chat with us/i }).click();

// Step 3: Send message
const messageInput = page.locator('textarea[placeholder*="Type your message"]');
await messageInput.fill('I need help');
await page.getByRole('button', { name: /send message/i }).click();

// Step 4: Verify message appears
await expect(page.getByText('I need help')).toBeVisible();
});

test('navigation: widget close and reopen maintains view', async ({ page }) => {
await page.goto('/');

// Open widget and go to chat
await page.getByRole('button', { name: /open support widget/i }).click();
await page.getByRole('button', { name: /chat with us/i }).click();

const messageInput = page.locator('textarea[placeholder*="Type your message"]');
await messageInput.fill('Test message');
await page.getByRole('button', { name: /send message/i }).click();

// Close widget
const floatingButton = page.locator('.fixed.bottom-6.right-6').first();
await floatingButton.click();

// Reopen widget
await floatingButton.click();

// Should still show the message
await expect(page.getByText('Test message')).toBeVisible();
});
});
