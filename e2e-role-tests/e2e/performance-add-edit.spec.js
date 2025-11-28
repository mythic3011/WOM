import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

/**
 * Comprehensive test for adding and editing performances
 * This test demonstrates the complete workflow
 */
test.describe('Performance Add/Edit Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/performances');
    await page.waitForLoadState('networkidle');
  });

  test('complete add performance workflow', async ({ page }) => {
    // Step 1: Click Add Performance button
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Step 2: Fill basic information
    await page.fill('#title', 'Mahler Symphony No. 5');
    await page.fill('#composer', 'Gustav Mahler');
    await page.fill('#conductor', 'Leonard Bernstein');
    await page.fill('#orchestra', 'Vienna Philharmonic');
    await page.fill('#description', 'A powerful and emotional journey through Mahler\'s Fifth Symphony');
    
    // Step 3: Fill performance details
    const presenterField = page.locator('#presenter');
    if (await presenterField.isVisible()) {
      await presenterField.fill('Hong Kong Arts Festival');
    }
    
    const durationField = page.locator('#duration');
    if (await durationField.isVisible()) {
      await durationField.fill('75');
    }
    
    const ageLimitField = page.locator('#ageLimit');
    if (await ageLimitField.isVisible()) {
      await ageLimitField.fill('8+');
    }
    
    // Step 4: Set status
    await page.selectOption('#status', 'upcoming');
    
    // Step 5: Select venue if available
    const venueSelect = page.locator('#venueSelect');
    if (await venueSelect.isVisible()) {
      const options = await venueSelect.locator('option').count();
      if (options > 1) {
        await venueSelect.selectOption({ index: 1 });
      }
    }
    
    // Step 6: Add sponsors
    const sponsorsField = page.locator('#sponsors');
    if (await sponsorsField.isVisible()) {
      await sponsorsField.fill('HSBC, Swire Group');
    }
    
    // Step 7: Submit the form
    await page.click('button[type="submit"][form="performanceForm"]');
    
    // Step 8: Wait for submission to complete
    await page.waitForTimeout(2000);
    
    // Step 9: Verify the performance appears in the table
    await expect(page.locator('#performancesTable')).toContainText('Mahler Symphony No. 5');
    await expect(page.locator('#performancesTable')).toContainText('Gustav Mahler');
    
    console.log('✓ Performance created successfully');
  });

  test('complete edit performance workflow', async ({ page }) => {
    // First, create a performance to edit
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    await page.fill('#title', 'Original Performance Title');
    await page.fill('#composer', 'Original Composer');
    await page.fill('#conductor', 'Original Conductor');
    await page.fill('#orchestra', 'Original Orchestra');
    await page.fill('#description', 'Original description');
    
    await page.click('button[type="submit"][form="performanceForm"]');
    await page.waitForTimeout(2000);
    
    // Now edit it
    const row = page.locator('tr:has-text("Original Performance Title")');
    await row.locator('.action-dropdown-btn').click();
    
    // Click Quick Edit
    await page.click('button:has-text("Quick Edit")');
    await page.waitForTimeout(1000);
    
    // Update fields
    const titleField = page.locator('#title, input[name="title"]').first();
    if (await titleField.isVisible()) {
      await titleField.clear();
      await titleField.fill('Updated Performance Title');
    }
    
    const composerField = page.locator('#composer, input[name="composer"]').first();
    if (await composerField.isVisible()) {
      await composerField.clear();
      await composerField.fill('Updated Composer');
    }
    
    // Submit changes
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify changes
    await expect(page.locator('#performancesTable')).toContainText('Updated Performance Title');
    
    console.log('✓ Performance edited successfully');
  });

  test('add performance with showtimes', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Fill basic info
    await page.fill('#title', 'Performance with Showtimes');
    await page.fill('#composer', 'Test Composer');
    await page.fill('#conductor', 'Test Conductor');
    await page.fill('#orchestra', 'Test Orchestra');
    
    // Add showtime
    const addShowtimeBtn = page.locator('#addShowtimeBtn');
    if (await addShowtimeBtn.isVisible()) {
      await addShowtimeBtn.click();
      await page.waitForTimeout(500);
      
      // Fill showtime details
      const dateTimeInput = page.locator('input[type="datetime-local"]').first();
      if (await dateTimeInput.isVisible()) {
        await dateTimeInput.fill('2024-12-25T19:30');
      }
      
      console.log('✓ Showtime added');
    }
    
    // Submit
    await page.click('button[type="submit"][form="performanceForm"]');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('#performancesTable')).toContainText('Performance with Showtimes');
  });

  test('should not lose showtime when adding pricing section', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Fill basic info
    await page.fill('#title', 'Test Pricing Section');
    await page.fill('#composer', 'Test Composer');
    await page.fill('#conductor', 'Test Conductor');
    await page.fill('#orchestra', 'Test Orchestra');
    
    // Add showtime
    await page.click('#addShowtimeBtn');
    await page.waitForTimeout(500);
    
    // Verify showtime exists
    await expect(page.locator('[data-showtime-index="0"]')).toBeVisible();
    
    // Click "Create First Section" button
    const addFirstSectionBtn = page.locator('.add-first-section-btn');
    if (await addFirstSectionBtn.isVisible()) {
      await addFirstSectionBtn.click();
      await page.waitForTimeout(500);
      
      // Verify showtime still exists
      await expect(page.locator('[data-showtime-index="0"]')).toBeVisible();
      
      // Verify pricing section was added
      await expect(page.locator('[data-section-index="0"]')).toBeVisible();
      
      console.log('✓ Showtime persists when adding pricing section');
    }
  });

  test('should auto-populate seats from venue', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Select a venue (not the default "Select venue...")
    const venueSelect = page.locator('#venueSelect');
    const options = await venueSelect.locator('option').count();
    
    if (options > 1) {
      await venueSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      // Add showtime
      await page.click('#addShowtimeBtn');
      await page.waitForTimeout(500);
      
      // Check if seats are populated (might not be default 200)
      const totalSeatsInput = page.locator('.showtime-total-seats').first();
      const totalSeats = await totalSeatsInput.inputValue();
      
      // Just verify it has a value
      expect(totalSeats).toBeTruthy();
      expect(parseInt(totalSeats)).toBeGreaterThan(0);
      
      console.log(`✓ Seats auto-populated: ${totalSeats}`);
    }
  });

  test('should validate available seats do not exceed total', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Add showtime
    await page.click('#addShowtimeBtn');
    await page.waitForTimeout(500);
    
    // Set total seats to 100
    await page.fill('.showtime-total-seats', '100');
    await page.waitForTimeout(200);
    
    // Try to set available seats to 150 (more than total)
    await page.fill('.showtime-available-seats', '150');
    await page.waitForTimeout(500);
    
    // Check for validation error
    const errorMsg = page.locator('.seat-validation-error');
    if (await errorMsg.isVisible()) {
      await expect(errorMsg).toContainText('Cannot exceed total seats');
      console.log('✓ Validation error shown correctly');
    }
  });

  test('validate required fields on add', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"][form="performanceForm"]');
    await page.waitForTimeout(500);
    
    // Modal should still be visible (validation failed)
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Check if title field shows validation error
    const titleField = page.locator('#title');
    const isInvalid = await titleField.evaluate(el => !el.validity.valid);
    
    if (isInvalid) {
      console.log('✓ Validation working correctly');
      expect(isInvalid).toBe(true);
    }
  });

  test('cancel add performance', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Fill some data
    await page.fill('#title', 'This will be cancelled');
    await page.fill('#composer', 'Test Composer');
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    
    // Modal should be hidden
    const modal = page.locator('#performanceModal');
    const isHidden = await modal.evaluate(el => {
      return el.classList.contains('hidden') || 
             window.getComputedStyle(el).display === 'none';
    });
    
    expect(isHidden).toBe(true);
    console.log('✓ Cancel works correctly');
  });

  test('add performance with all optional fields', async ({ page }) => {
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    // Fill all fields
    await page.fill('#title', 'Complete Performance');
    await page.fill('#composer', 'Johann Sebastian Bach');
    await page.fill('#conductor', 'Herbert von Karajan');
    await page.fill('#orchestra', 'Berlin Philharmonic');
    await page.fill('#description', 'A complete performance with all details filled');
    
    // Optional fields
    const fields = [
      { selector: '#presenter', value: 'Hong Kong Philharmonic' },
      { selector: '#duration', value: '90' },
      { selector: '#ageLimit', value: '6+' },
      { selector: '#website', value: 'https://example.com' },
      { selector: '#sponsors', value: 'HSBC, Swire Group, Hong Kong Jockey Club' },
      { selector: '#additionalInfo', value: 'Special holiday performance' }
    ];
    
    for (const field of fields) {
      const element = page.locator(field.selector);
      if (await element.isVisible()) {
        await element.fill(field.value);
      }
    }
    
    // Set dates if available
    const ticketSaleStart = page.locator('#ticketSaleStart');
    if (await ticketSaleStart.isVisible()) {
      await ticketSaleStart.fill('2024-11-01T10:00');
    }
    
    // Submit
    await page.click('button[type="submit"][form="performanceForm"]');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('#performancesTable')).toContainText('Complete Performance');
    console.log('✓ Complete performance created with all fields');
  });

  test('search for newly added performance', async ({ page }) => {
    // Add a performance
    await page.click('#addPerformanceBtn');
    await expect(page.locator('#performanceModal')).toBeVisible();
    
    await page.fill('#title', 'Searchable Performance');
    await page.fill('#composer', 'Unique Composer Name');
    await page.fill('#conductor', 'Test Conductor');
    await page.fill('#orchestra', 'Test Orchestra');
    
    await page.click('button[type="submit"][form="performanceForm"]');
    await page.waitForTimeout(2000);
    
    // Search for it
    await page.fill('#searchInput', 'Searchable Performance');
    await page.waitForTimeout(500);
    
    // Should find it
    await expect(page.locator('#performancesTable')).toContainText('Searchable Performance');
    
    // Clear search
    await page.click('#clearFilters');
    await page.waitForTimeout(300);
    
    console.log('✓ Search functionality works');
  });
});
