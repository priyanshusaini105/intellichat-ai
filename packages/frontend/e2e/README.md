# Playwright Tests for IntelliChat AI Frontend

This directory contains comprehensive end-to-end tests for the IntelliChat AI chat widget using Playwright.

## Test Structure

### 1. `demo.test.ts` - Core Functionality Tests
Basic widget functionality tests including:
- Widget opening/closing
- Welcome view display
- Contact details form
- Chat functionality
- Message sending and receiving
- Navigation between views
- Accessibility basics
- Responsive design
- Edge cases and validation

**Key Test Suites:**
- **Basic Functionality**: Widget visibility, opening, closing
- **Welcome View**: Initial screen, quick questions, transitions
- **Contact Details Form**: Form validation, submission, skipping
- **Chat Functionality**: Message sending, keyboard shortcuts, agent responses
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Responsiveness**: Mobile, tablet, and desktop viewports
- **Edge Cases**: Long messages, special characters, rapid interactions

### 2. `user-flows.test.ts` - Integration Tests
Complete user journey tests covering:
- Multi-step onboarding flows
- Navigation patterns across views
- Error recovery scenarios
- Multi-turn conversations
- Contact detail variations
- Performance and timing

**Key Test Suites:**
- **Complete Onboarding Journey**: Full user flows from start to finish
- **Navigation Patterns**: Back/forth navigation, state persistence
- **Error Recovery**: Handling incomplete flows, edge cases
- **Multi-Turn Conversations**: Realistic conversation simulations
- **Contact Details Variations**: Different form filling scenarios
- **Widget Interaction Patterns**: Complex interaction sequences
- **Performance and Timing**: Response times, loading speeds

### 3. `accessibility.test.ts` - Accessibility Tests
WCAG compliance and accessibility tests:
- ARIA attributes and semantic HTML
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management
- Form validation
- Mobile touch targets

**Key Test Suites:**
- **ARIA and Semantic HTML**: Proper markup structure
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Announced content, readable messages
- **Color Contrast and Visual**: Text visibility, focus indicators
- **Form Validation**: Error messages, required fields
- **Motion and Animation**: Smooth transitions, non-blocking animations
- **Mobile and Touch**: Touch target sizes, mobile usability
- **Error States**: Graceful error handling
- **Content Structure**: Logical reading order, context

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in UI mode (recommended for development)
```bash
pnpm test:ui
```

### Run specific test file
```bash
pnpm exec playwright test e2e/demo.test.ts
```

### Run tests in headed mode (see browser)
```bash
pnpm exec playwright test --headed
```

### Run tests for specific browser
```bash
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
pnpm exec playwright test --project="Mobile Chrome"
```

### Debug tests
```bash
pnpm exec playwright test --debug
```

### Generate test report
```bash
pnpm exec playwright show-report
```

## Test Coverage

### Functional Coverage
- ✅ Widget open/close functionality
- ✅ Welcome screen display and navigation
- ✅ Quick question interactions
- ✅ Contact details form submission
- ✅ Contact details form validation
- ✅ Chat message sending (click and Enter key)
- ✅ Agent response simulation
- ✅ Message persistence across views
- ✅ Back navigation
- ✅ Multi-turn conversations
- ✅ Different keyword-based responses

### Accessibility Coverage
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation through entire widget
- ✅ Focus management
- ✅ Form input types and validation
- ✅ Screen reader compatible text content
- ✅ Visual contrast and readability
- ✅ Touch target sizing (mobile)

### Browser Coverage
- ✅ Desktop Chrome
- ✅ Desktop Firefox
- ✅ Desktop Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

### Viewport Coverage
- ✅ Desktop (1280x720+)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667, 320x568)

### Edge Cases
- ✅ Empty message submission
- ✅ Very long messages (500+ chars)
- ✅ Special characters and XSS prevention
- ✅ Rapid message sending
- ✅ Whitespace-only messages
- ✅ Invalid email format
- ✅ Partial form completion
- ✅ State persistence on widget close/reopen

## Test Philosophy

These tests follow the **Testing Trophy** approach:
1. **Integration Tests** (most tests): Test user flows and interactions
2. **E2E Tests**: Full user journeys from start to finish
3. **Accessibility Tests**: Ensure WCAG compliance

### Best Practices
- Tests use **user-facing selectors** (roles, labels) instead of implementation details
- Tests simulate **real user behavior** (clicking, typing, keyboard navigation)
- Tests are **independent** and can run in any order
- Tests use **descriptive names** that explain what they verify
- Tests **wait for conditions** instead of arbitrary timeouts (except where needed)

## Writing New Tests

### Template for a new test
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Common setup
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    await page.getByRole('button', { name: /open support widget/i }).click();
    
    // Act
    await page.getByRole('button', { name: /chat with us/i }).click();
    
    // Assert
    await expect(page.locator('textarea')).toBeVisible();
  });
});
```

### Selector Priority (from best to worst)
1. `getByRole()` - Accessible roles
2. `getByLabel()` - Form labels
3. `getByPlaceholder()` - Input placeholders
4. `getByText()` - Text content
5. `getByTestId()` - Test IDs (last resort)

## CI/CD Integration

Tests are configured to run in CI with:
- **Retries**: 2 retries on failure
- **Workers**: 1 worker (sequential execution for stability)
- **Reporter**: HTML report generated
- **Artifacts**: Screenshots and videos on failure
- **Traces**: Collected on retry for debugging

## Debugging Failed Tests

1. **View the HTML report**:
   ```bash
   pnpm exec playwright show-report
   ```

2. **Run with headed browser**:
   ```bash
   pnpm exec playwright test --headed
   ```

3. **Use debug mode**:
   ```bash
   pnpm exec playwright test --debug
   ```

4. **View trace files** (if available):
   - Open Playwright Inspector
   - Load the trace file from test results

## Performance Benchmarks

Expected performance targets (as tested):
- Widget opening: < 1 second
- Message appearance: < 500ms
- Agent response: < 2 seconds
- Page load: < 2 seconds

## Known Limitations

- Agent responses are simulated (not real LLM integration)
- Tests assume local development environment
- Some timing-dependent tests may be flaky on slow systems
- Visual regression tests (snapshots) not included to avoid false positives

## Future Improvements

- [ ] Add visual regression testing with Percy or similar
- [ ] Add performance monitoring with Lighthouse
- [ ] Add API mocking for backend integration tests
- [ ] Add cross-browser screenshot comparison
- [ ] Add automated accessibility audits with axe-core
- [ ] Add test coverage reporting

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing Guide](https://playwright.dev/docs/accessibility-testing)
- [Web Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
