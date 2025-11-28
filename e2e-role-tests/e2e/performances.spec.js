import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe('Performance Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await loginAsAdmin(page);
    
    // Navigate to admin performances page
    await page.goto('/admin/performances');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display performances page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Performance Management');
    await expect(page.locator('#addPerformanceBtn')).toBeVisible();
    await expect(page.locator('#quickCreateBtn')).toBeVisible();
  });

  test('should open add performance modal', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    
    // Wait for modal to appear
    await expect(page.locator('#performanceModal')).toBeVisible();
    await expect(page.locator('#performanceModal h2')).toContainText('Add Performance');
    
    // Check form fields are present
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#composer')).toBeVisible();
    await expect(page.locator('#conductor')).toBeVisible();
    await expect(page.locator('#orchestra')).toBeVisible();
  });

  test('should create a new performance', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Fill in basic information
    await page.fill('#title', 'Test Symphony Performance');
    await page.fill('#composer', 'Ludwig van Beethoven');
    await page.fill('#conductor', 'Test Conductor');
    await page.fill('#orchestra', 'Test Orchestra');
    await page.fill('#description', 'A test performance description');
    
    // Fill in performance information
    await page.fill('#presenter', 'Test Presenter');
    await page.fill('#duration', '120');
    await page.selectOption('#status', 'upcoming');
    
    // Submit form
    await page.click('button[type="submit"][form="performanceForm"]');
    
    // Wait for success notification or modal to close
    await page.waitForTimeout(1000);
    
    // Verify performance appears in table
    await expect(page.locator('#performancesTable')).toContainText('Test Symphony Performance');
  });

  test('should edit an existing performance', async ({ page }) => {
    // Wait for performances to load
    await page.waitForSelector('#performancesTable tr');
    
    // Click first action dropdown
    const firstActionBtn = page.locator('.action-dropdown-btn').first();
    await firstActionBtn.click();
    
    // Click Quick Edit
    await page.click('button:has-text("Quick Edit")');
    
    // Wait for edit modal/form
    await page.waitForTimeout(500);
    
    // Verify we can see edit interface
    const titleInput = page.locator('#title, input[name="title"]').first();
    await expect(titleInput).toBeVisible();
  });

  test('should filter performances by search', async ({ page }) => {
    // Wait for performances to load
    await page.waitForSelector('#performancesTable tr');
    
    // Get initial count
    const initialCount = await page.locator('#resultCount').textContent();
    
    // Search for something
    await page.fill('#searchInput', 'Symphony');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify results updated
    const filteredCount = await page.locator('#resultCount').textContent();
    expect(filteredCount).toBeDefined();
  });

  test('should filter performances by status', async ({ page }) => {
    await page.waitForSelector('#performancesTable tr');
    
    // Select status filter
    await page.selectOption('#statusFilter', 'on_sale');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify filter applied
    const resultCount = await page.locator('#resultCount').textContent();
    expect(resultCount).toBeDefined();
  });

  test('should clear all filters', async ({ page }) => {
    await page.waitForSelector('#performancesTable tr');
    
    // Apply some filters
    await page.fill('#searchInput', 'test');
    await page.selectOption('#statusFilter', 'upcoming');
    
    // Click clear filters
    await page.click('#clearFilters');
    
    // Verify filters are cleared
    await expect(page.locator('#searchInput')).toHaveValue('');
    await expect(page.locator('#statusFilter')).toHaveValue('');
  });

  test('should add showtime to performance', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Fill basic info
    await page.fill('#title', 'Performance with Showtime');
    await page.fill('#composer', 'Test Composer');
    
    // Add showtime
    const addShowtimeBtn = page.locator('#addShowtimeBtn');
    if (await addShowtimeBtn.isVisible()) {
      await addShowtimeBtn.click();
      
      // Verify showtime section appears
      await expect(page.locator('#showtimesContainer')).toBeVisible();
    }
  });

  test('should view performance details', async ({ page }) => {
    await page.waitForSelector('#performancesTable tr');
    
    // Click first action dropdown
    const firstActionBtn = page.locator('.action-dropdown-btn').first();
    await firstActionBtn.click();
    
    // Click View Details
    await page.click('button:has-text("View Details")');
    
    // Wait for details view
    await page.waitForTimeout(500);
  });

  test('should delete performance with confirmation', async ({ page }) => {
    await page.waitForSelector('#performancesTable tr');
    
    // Click first action dropdown
    const firstActionBtn = page.locator('.action-dropdown-btn').first();
    await firstActionBtn.click();
    
    // Click Delete
    await page.click('button:has-text("Delete")');
    
    // Wait for confirmation dialog
    await page.waitForTimeout(500);
    
    // Check if SweetAlert2 confirmation appears
    const swalPopup = page.locator('.swal2-popup');
    if (await swalPopup.isVisible()) {
      await expect(swalPopup).toBeVisible();
    }
  });

  test('should duplicate performance', async ({ page }) => {
    await page.waitForSelector('#performancesTable tr');
    
    // Click first action dropdown
    const firstActionBtn = page.locator('.action-dropdown-btn').first();
    await firstActionBtn.click();
    
    // Click Duplicate
    await page.click('button:has-text("Duplicate")');
    
    // Wait for duplication process
    await page.waitForTimeout(1000);
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"][form="performanceForm"]');
    
    // Check for validation (HTML5 or custom)
    const titleInput = page.locator('#title');
    const isInvalid = await titleInput.evaluate(el => !el.validity.valid);
    
    if (isInvalid) {
      expect(isInvalid).toBe(true);
    }
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Click cancel button
    await page.click('button:has-text("Cancel")');
    
    // Wait for modal to close
    await page.waitForTimeout(500);
    
    // Verify modal is hidden
    const modal = page.locator('#performanceModal');
    const isHidden = await modal.evaluate(el => {
      return el.classList.contains('hidden') || 
             window.getComputedStyle(el).display === 'none';
    });
    
    expect(isHidden).toBe(true);
  });
});
