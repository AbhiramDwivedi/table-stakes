import { test, expect } from '@playwright/test';

// These tests would be run with the Playwright test runner
// and require the application to be running in a test environment
test.describe('Query Flow End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    // Wait for the application to be fully loaded
    await page.waitForSelector('.query-input-container', { state: 'visible' });
  });

  test('should be able to submit a query and see results', async ({ page }) => {
    // Type a query
    await page.fill('.query-input', 'Show me all users');
    
    // Submit the query
    await page.click('.query-submit-button');
    
    // Wait for results to appear
    await page.waitForSelector('.results-container', { state: 'visible', timeout: 10000 });
    
    // Verify that results are displayed
    const tableElement = await page.locator('.results-table');
    expect(await tableElement.isVisible()).toBeTruthy();
    
    // Check that the table has data rows
    const rowCount = await page.locator('.results-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should display visualization for a graph query', async ({ page }) => {
    // Type a visualization query
    await page.fill('.query-input', 'Show me a bar chart of enrollments by course');
    
    // Submit the query
    await page.click('.query-submit-button');
    
    // Wait for results to appear
    await page.waitForSelector('.chart-container', { state: 'visible', timeout: 10000 });
    
    // Verify that a chart is displayed
    const chartElement = await page.locator('.recharts-responsive-container');
    expect(await chartElement.isVisible()).toBeTruthy();
  });

  test('should handle error gracefully', async ({ page }) => {
    // Type an invalid query
    await page.fill('.query-input', 'This is not a valid query');
    
    // Submit the query
    await page.click('.query-submit-button');
    
    // Wait for error message
    await page.waitForSelector('.error-message', { state: 'visible', timeout: 10000 });
    
    // Verify error message is displayed
    const errorElement = await page.locator('.error-message');
    expect(await errorElement.isVisible()).toBeTruthy();
    expect(await errorElement.textContent()).toContain('Error');
  });

  test('should allow exporting query results', async ({ page }) => {
    // Type a query
    await page.fill('.query-input', 'Show me all enrollments');
    
    // Submit the query
    await page.click('.query-submit-button');
    
    // Wait for results to appear
    await page.waitForSelector('.results-container', { state: 'visible', timeout: 10000 });
    
    // Click export button
    await page.click('.export-button');
    
    // Verify download starts - this is tricky to test in Playwright
    // One approach is to use the download event
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.click('.download-csv-button')
    ]);
    
    // Check that download started
    expect(download[0].suggestedFilename()).toContain('.csv');
  });
});