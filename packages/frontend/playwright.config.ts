import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	
	// Maximum time one test can run
	timeout: 30 * 1000,
	
	// Test execution settings
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	
	// Reporter to use
	reporter: process.env.CI ? 'html' : 'list',
	
	use: {
		// Base URL for all tests
		baseURL: 'http://localhost:4173',
		
		// Collect trace when retrying the failed test
		trace: 'on-first-retry',
		
		// Screenshot on failure
		screenshot: 'only-on-failure',
		
		// Video on failure
		video: 'retain-on-failure',
	},
	
	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		// Mobile viewports
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],
	
	// Run your local dev server before starting the tests
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
	},
});
