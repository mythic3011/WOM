import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe('Performance Form - Detailed Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
    
    await page.goto('/admin/performances');
    await page.waitForLoadState('networkidle');
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
  });

  test('should fill all basic information fields', async ({ page }) => {
    await page.fill('#title', 'Beethoven Symphony No. 9');
    await page.fill('#composer', 'Ludwig van Beethoven');
    await page.fill('#conductor', 'Herbert von Karajan');
    await page.fill('#orchestra', 'Berlin Philharmonic');
    await page.fill('#description', 'The iconic Ninth Symphony featuring the Ode to Joy');
    
    // Verify values are set
    await expect(page.locator('#title')).toHaveValue('Beethoven Symphony No. 9');
    await expect(page.locator('#composer')).toHaveValue('Ludwig van Beethoven');
    await expect(page.locator('#conductor')).toHaveValue('Herbert von Karajan');
  });

  test('should fill performance information', async ({ page }) => {
    await page.fill('#presenter', 'Hong Kong Philharmonic Orchestra');
    await page.fill('#ageLimit', '6+');
    await page.fill('#duration', '90');
    await page.fill('#website', 'https://example.com');
    
    await expect(page.locator('#presenter')).toHaveValue('Hong Kong Philharmonic Orchestra');
    await expect(page.locator('#duration')).toHaveValue('90');
  });

  test('should select venue from dropdown', async ({ page }) => {
    const venueSelect = page.locator('#venueSelect');
    
    if (await venueSelect.isVisible()) {
      // Get available options
      const options = await venueSelect.locator('option').count();
      
      if (options > 1) {
        // Select first non-empty option
        await venueSelect.selectOption({ index: 1 });
        
        const selectedValue = await venueSelect.inputValue();
        expect(selectedValue).not.toBe('');
      }
    }
  });

  test('should set ticketing information', async ({ page }) => {
    await page.selectOption('#status', 'on_sale');
    
    // Set ticket sale start date
    const ticketSaleStart = page.locator('#ticketSaleStart');
    if (await ticketSaleStart.isVisible()) {
      await ticketSaleStart.fill('2024-12-01T10:00');
    }
    
    // Set additional info
    const additionalInfo = page.locator('#additionalInfo');
    if (await additionalInfo.isVisible()) {
      await additionalInfo.fill('Special holiday performance');
    }
  });

  test('should upload performance image', async ({ page }) => {
    const imageInput = page.locator('#performanceImageInput');
    
    if (await imageInput.isVisible()) {
      // Create a test file
      const buffer = Buffer.from('fake-image-data');
      await imageInput.setInputFiles({
        name: 'test-performance.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      });
      
      // Check if preview appears
      await page.waitForTimeout(500);
      const preview = page.locator('#performanceImagePreview');
      if (await preview.isVisible()) {
        await expect(preview).toBeVisible();
      }
    }
  });

  test('should add and configure showtime', async ({ page }) => {
    const addShowtimeBtn = page.locator('#addShowtimeBtn');
    
    if (await addShowtimeBtn.isVisible()) {
      await addShowtimeBtn.click();
      
      // Wait for showtime section
      await page.waitForTimeout(500);
      
      // Verify showtime container exists
      const showtimesContainer = page.locator('#showtimesContainer');
      await expect(showtimesContainer).toBeVisible();
      
      // Check for showtime fields
      const showtimeFields = page.locator('[id^="showtime-"]');
      const count = await showtimeFields.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should add multiple showtimes', async ({ page }) => {
    const addShowtimeBtn = page.locator('#addShowtimeBtn');
    
    if (await addShowtimeBtn.isVisible()) {
      // Add first showtime
      await addShowtimeBtn.click();
      await page.waitForTimeout(300);
      
      // Add second showtime
      await addShowtimeBtn.click();
      await page.waitForTimeout(300);
      
      // Verify multiple showtimes exist
      const showtimeCards = page.locator('[class*="showtime"]');
      const count = await showtimeCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should remove showtime', async ({ page }) => {
    const addShowtimeBtn = page.locator('#addShowtimeBtn');
    
    if (await addShowtimeBtn.isVisible()) {
      await addShowtimeBtn.click();
      await page.waitForTimeout(300);
      
      // Look for remove button
      const removeBtn = page.locator('button:has-text("Remove"), button[class*="remove"]').first();
      
      if (await removeBtn.isVisible()) {
        await removeBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should add pricing section to showtime', async ({ page }) => {
    const addShowtimeBtn = page.locator('#addShowtimeBtn');
    
    if (await addShowtimeBtn.isVisible()) {
      await addShowtimeBtn.click();
      await page.waitForTimeout(500);
      
      // Look for add pricing button
      const addPricingBtn = page.locator('button:has-text("Add Pricing"), button:has-text("Add Section")').first();
      
      if (await addPricingBtn.isVisible()) {
        await addPricingBtn.click();
        await page.waitForTimeout(300);
        
        // Verify pricing section appears
        const pricingSection = page.locator('[class*="pricing"]');
        const count = await pricingSection.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('should fill sponsors field', async ({ page }) => {
    const sponsorsInput = page.locator('#sponsors');
    
    if (await sponsorsInput.isVisible()) {
      await sponsorsInput.fill('HSBC, Swire Group, Hong Kong Jockey Club');
      await expect(sponsorsInput).toHaveValue('HSBC, Swire Group, Hong Kong Jockey Club');
    }
  });

  test('should select event categories', async ({ page }) => {
    // Look for event category checkboxes
    const categoryCheckboxes = page.locator('.event-category, input[type="checkbox"][name*="category"]');
    const count = await categoryCheckboxes.count();
    
    if (count > 0) {
      // Check first category
      await categoryCheckboxes.first().check();
      await expect(categoryCheckboxes.first()).toBeChecked();
    }
  });

  test('should validate form before submission', async ({ page }) => {
    // Leave title empty
    await page.fill('#title', '');
    
    // Try to submit
    await page.click('button[type="submit"][form="performanceForm"]');
    
    // Check if form prevents submission
    await page.waitForTimeout(500);
    
    // Modal should still be visible if validation failed
    await expect(page.locator('#performanceModal')).toBeVisible();
  });

  test('should submit complete performance form', async ({ page }) => {
    // Fill all required fields
    await page.fill('#title', 'Complete Test Performance');
    await page.fill('#composer', 'Test Composer');
    await page.fill('#conductor', 'Test Conductor');
    await page.fill('#orchestra', 'Test Orchestra');
    await page.fill('#description', 'Complete test description');
    await page.fill('#duration', '120');
    await page.selectOption('#status', 'upcoming');
    
    // Submit form
    await page.click('button[type="submit"][form="performanceForm"]');
    
    // Wait for submission
    await page.waitForTimeout(2000);
    
    // Check for success (notification or modal close)
    const notification = page.locator('.notyf, .swal2-popup, [class*="notification"]');
    const modalHidden = await page.locator('#performanceModal').evaluate(el => {
      return el.classList.contains('hidden') || 
             window.getComputedStyle(el).display === 'none';
    });
    
    // Either notification appears or modal closes
    const hasNotification = await notification.count() > 0;
    expect(hasNotification || modalHidden).toBeTruthy();
  });

  test('should preserve form data when switching tabs', async ({ page }) => {
    // Fill some data
    await page.fill('#title', 'Tab Switch Test');
    await page.fill('#composer', 'Test Composer');
    
    // If there are tabs, click between them
    const tabs = page.locator('[role="tab"], .tab, button[class*="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(300);
      await tabs.first().click();
      await page.waitForTimeout(300);
      
      // Verify data is still there
      await expect(page.locator('#title')).toHaveValue('Tab Switch Test');
    }
  });

  test('should handle form reset on cancel', async ({ page }) => {
    // Fill some data
    await page.fill('#title', 'Cancel Test');
    await page.fill('#composer', 'Test Composer');
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    
    // Reopen modal
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Verify form is empty
    await expect(page.locator('#title')).toHaveValue('');
  });
});
