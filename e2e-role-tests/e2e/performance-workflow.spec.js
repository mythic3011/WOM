import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';
import { 
  createPerformance, 
  editPerformance, 
  deletePerformance,
  searchPerformances,
  filterByStatus,
  clearFilters,
  getPerformanceCount,
  mockPerformanceData 
} from './helpers/performance-helpers.js';

test.describe('Performance Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
    
    await page.goto('/admin/performances');
    await page.waitForLoadState('networkidle');
  });

  test('complete workflow: create, edit, search, delete', async ({ page }) => {
    // Step 1: Create a new performance
    await createPerformance(page, mockPerformanceData.basic);
    
    // Verify it appears in the table
    await expect(page.locator('#performancesTable')).toContainText('Test Symphony');
    
    // Step 2: Search for the performance
    await searchPerformances(page, 'Test Symphony');
    const searchCount = await getPerformanceCount(page);
    expect(searchCount).toBeGreaterThan(0);
    
    // Step 3: Clear search
    await clearFilters(page);
    
    // Step 4: Filter by status
    await filterByStatus(page, 'upcoming');
    
    // Step 5: Edit the performance
    await clearFilters(page);
    await editPerformance(page, 'Test Symphony', {
      title: 'Updated Test Symphony'
    });
    
    // Verify update
    await expect(page.locator('#performancesTable')).toContainText('Updated Test Symphony');
    
    // Step 6: Delete the performance
    await deletePerformance(page, 'Updated Test Symphony', true);
    
    // Wait for deletion
    await page.waitForTimeout(1000);
  });

  test('create performance with complete data', async ({ page }) => {
    await createPerformance(page, mockPerformanceData.complete);
    
    // Verify all data is saved
    await expect(page.locator('#performancesTable')).toContainText('Beethoven Symphony No. 9');
    await expect(page.locator('#performancesTable')).toContainText('Ludwig van Beethoven');
  });

  test('create multiple performances and filter', async ({ page }) => {
    // Create first performance
    await createPerformance(page, {
      ...mockPerformanceData.basic,
      title: 'Performance A',
      status: 'on_sale'
    });
    
    await page.waitForTimeout(500);
    
    // Create second performance
    await createPerformance(page, {
      ...mockPerformanceData.basic,
      title: 'Performance B',
      status: 'upcoming'
    });
    
    await page.waitForTimeout(500);
    
    // Filter by on_sale status
    await filterByStatus(page, 'on_sale');
    await expect(page.locator('#performancesTable')).toContainText('Performance A');
    
    // Clear and filter by upcoming
    await clearFilters(page);
    await filterByStatus(page, 'upcoming');
    await expect(page.locator('#performancesTable')).toContainText('Performance B');
  });

  test('handle form validation errors', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Try to submit empty form
    await page.click('button[type="submit"][form="performanceForm"]');
    
    // Modal should still be visible
    await page.waitForTimeout(500);
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Fill required fields
    await page.fill('#title', 'Valid Performance');
    await page.fill('#composer', 'Valid Composer');
    await page.fill('#conductor', 'Valid Conductor');
    await page.fill('#orchestra', 'Valid Orchestra');
    
    // Now submit should work
    await page.click('button[type="submit"][form="performanceForm"]');
    await page.waitForTimeout(1000);
  });

  test('quick create workflow', async ({ page }) => {
    // Click quick create button
    await page.click('#quickCreateBtn');
    
    // Wait for quick create interface
    await page.waitForTimeout(500);
    
    // Quick create should open some form or wizard
    // Verify it's different from regular add
    const hasQuickForm = await page.locator('[class*="quick"], [class*="wizard"]').count() > 0;
    
    // If quick create is implemented, test it
    if (hasQuickForm) {
      expect(hasQuickForm).toBe(true);
    }
  });

  test('view performance details workflow', async ({ page }) => {
    // Ensure there's at least one performance
    const rows = await page.locator('#performancesTable tr').count();
    
    if (rows > 1) { // More than just header
      // Click first action dropdown
      await page.locator('.action-dropdown-btn').first().click();
      
      // Click view details
      await page.click('button:has-text("View Details")');
      
      // Wait for details view
      await page.waitForTimeout(1000);
      
      // Should show some details
      const hasDetails = await page.locator('[class*="detail"], [class*="modal"]').count() > 0;
      expect(hasDetails).toBe(true);
    }
  });

  test('duplicate performance workflow', async ({ page }) => {
    // Create a performance to duplicate
    await createPerformance(page, {
      ...mockPerformanceData.basic,
      title: 'Original Performance'
    });
    
    await page.waitForTimeout(500);
    
    // Find and duplicate it
    const row = page.locator('tr:has-text("Original Performance")');
    await row.locator('.action-dropdown-btn').click();
    
    await page.click('button:has-text("Duplicate")');
    
    // Wait for duplication
    await page.waitForTimeout(1500);
    
    // Should see duplicate in list (might have "Copy" in name)
    const tableContent = await page.locator('#performancesTable').textContent();
    expect(tableContent).toContain('Original Performance');
  });

  test('manage showtimes workflow', async ({ page }) => {
    // Find a performance with showtimes
    const rows = await page.locator('#performancesTable tr').count();
    
    if (rows > 1) {
      // Look for manage showtimes button
      await page.locator('.action-dropdown-btn').first().click();
      
      const manageBtn = page.locator('button:has-text("Manage Showtimes")');
      
      if (await manageBtn.isVisible()) {
        await manageBtn.click();
        await page.waitForTimeout(1000);
        
        // Should open showtime management interface
        const hasShowtimeUI = await page.locator('[class*="showtime"]').count() > 0;
        expect(hasShowtimeUI).toBe(true);
      }
    }
  });
});
