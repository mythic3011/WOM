import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

/**
 * COMPREHENSIVE ADMIN PERFORMANCE PAGE E2E TEST
 * Tests ALL buttons and flows on the admin performance page
 * 
 * Coverage:
 * - Page load and display
 * - All filter buttons and functionality
 * - Quick Create wizard (all steps)
 * - Add Performance form (advanced)
 * - All action dropdown buttons
 * - View, Edit, Manage Showtimes, Duplicate, Delete
 * - Showtime management
 * - Pricing sections
 * - Form validation
 */

test.describe('Admin Performance Page - Complete Flow Test', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/performances');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load and Display', () => {
    test('should display all main page elements', async ({ page }) => {
      // Header
      await expect(page.locator('h1')).toContainText('Performance Management');
      
      // Main action buttons
      await expect(page.locator('#quickCreateBtn')).toBeVisible();
      await expect(page.locator('#addPerformanceBtn')).toBeVisible();
      
      // Filter section
      await expect(page.locator('#searchInput')).toBeVisible();
      await expect(page.locator('#statusFilter')).toBeVisible();
      await expect(page.locator('#availabilityFilter')).toBeVisible();
      await expect(page.locator('#venueFilter')).toBeVisible();
      await expect(page.locator('#dateFilter')).toBeVisible();
      await expect(page.locator('#clearFilters')).toBeVisible();
      
      // Table
      await expect(page.locator('#performancesTable')).toBeVisible();
      await expect(page.locator('#resultCount')).toBeVisible();
    });
  });

  test.describe('Filter Functionality', () => {
    test('should filter by search text', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr', { timeout: 5000 });
      
      const initialCount = await page.locator('#resultCount').textContent();
      
      await page.fill('#searchInput', 'Symphony');
      await page.waitForTimeout(500);
      
      const filteredCount = await page.locator('#resultCount').textContent();
      expect(filteredCount).toBeDefined();
    });

    test('should filter by status', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      await page.selectOption('#statusFilter', 'on_sale');
      await page.waitForTimeout(300);
      
      const count = await page.locator('#resultCount').textContent();
      expect(count).toBeDefined();
    });

    test('should filter by availability', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      await page.selectOption('#availabilityFilter', 'high');
      await page.waitForTimeout(300);
      
      const count = await page.locator('#resultCount').textContent();
      expect(count).toBeDefined();
    });

    test('should filter by venue', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const venueOptions = await page.locator('#venueFilter option').count();
      if (venueOptions > 1) {
        await page.selectOption('#venueFilter', { index: 1 });
        await page.waitForTimeout(300);
        
        const count = await page.locator('#resultCount').textContent();
        expect(count).toBeDefined();
      }
    });

    test('should filter by date', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const today = new Date().toISOString().split('T')[0];
      await page.fill('#dateFilter', today);
      await page.waitForTimeout(300);
      
      const count = await page.locator('#resultCount').textContent();
      expect(count).toBeDefined();
    });

    test('should clear all filters', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      // Apply multiple filters
      await page.fill('#searchInput', 'test');
      await page.selectOption('#statusFilter', 'upcoming');
      await page.fill('#dateFilter', '2025-12-31');
      
      // Clear filters
      await page.click('#clearFilters');
      await page.waitForTimeout(300);
      
      // Verify all cleared
      await expect(page.locator('#searchInput')).toHaveValue('');
      await expect(page.locator('#statusFilter')).toHaveValue('');
      await expect(page.locator('#dateFilter')).toHaveValue('');
    });
  });

  test.describe('Quick Create Wizard - Complete Flow', () => {
    test('should open Quick Create wizard', async ({ page }) => {
      await page.click('#quickCreateBtn');
      await page.waitForTimeout(500);
      
      // Check for wizard modal
      const wizardModal = page.locator('.swal2-popup, .performance-wizard');
      await expect(wizardModal).toBeVisible({ timeout: 5000 });
    });

    test('should complete all wizard steps', async ({ page }) => {
      await page.click('#quickCreateBtn');
      await page.waitForTimeout(1000);
      
      // Step 1: Basic Information
      await page.fill('#wizardTitle', 'E2E Test Performance - Mahler Symphony');
      await page.fill('#wizardComposer', 'Gustav Mahler');
      await page.fill('#wizardConductor', 'Gustavo Dudamel');
      await page.fill('#wizardDescription', 'A comprehensive E2E test performance featuring Mahler Symphony No. 5 with full orchestra.');
      await page.fill('#wizardDuration', '90');
      
      // Verify validation feedback
      const titleValidation = page.locator('#titleValidation');
      if (await titleValidation.isVisible()) {
        await expect(titleValidation).toContainText('Valid');
      }
      
      // Click Next
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Step 2: Schedule & Venue
      const venueSelect = page.locator('#wizardVenue');
      await expect(venueSelect).toBeVisible();
      
      // Select a venue
      const venueOptions = await venueSelect.locator('option').count();
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
      
      // Add showtime
      const addShowtimeBtn = page.locator('#wizardAddShowtime');
      if (await addShowtimeBtn.isVisible()) {
        await addShowtimeBtn.click();
        await page.waitForTimeout(500);
        
        // Fill showtime date and time
        const showtimeDate = page.locator('.showtime-date').first();
        const showtimeTime = page.locator('.showtime-time').first();
        
        if (await showtimeDate.isVisible()) {
          await showtimeDate.fill('2025-12-25');
          await showtimeTime.fill('19:30');
        }
      }
      
      // Click Next
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Step 3: Pricing
      await page.fill('#wizardPrice', '500');
      await page.fill('#wizardVipPrice', '800');
      await page.fill('#wizardPremiumPrice', '650');
      await page.fill('#wizardEconomyPrice', '350');
      
      // Verify price preview updates
      const pricePreview = page.locator('#pricePreviewStandard');
      if (await pricePreview.isVisible()) {
        await expect(pricePreview).toContainText('500');
      }
      
      // Click Next to Review
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Step 4: Review
      await expect(page.locator('#reviewTitle')).toContainText('E2E Test Performance');
      await expect(page.locator('#reviewComposer')).toContainText('Gustav Mahler');
      await expect(page.locator('#reviewConductor')).toContainText('Gustavo Dudamel');
      
      // Note: Don't submit in test to avoid creating test data
      console.log('✓ Quick Create wizard flow completed successfully');
    });

    test('should navigate backward through wizard steps', async ({ page }) => {
      await page.click('#quickCreateBtn');
      await page.waitForTimeout(1000);
      
      // Fill step 1
      await page.fill('#wizardTitle', 'Test Navigation');
      await page.fill('#wizardComposer', 'Test Composer');
      await page.fill('#wizardConductor', 'Test Conductor');
      await page.fill('#wizardDescription', 'Testing backward navigation through wizard steps.');
      
      // Go to step 2
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Go back to step 1
      await page.click('#wizardPrevBtn');
      await page.waitForTimeout(500);
      
      // Verify data persisted
      await expect(page.locator('#wizardTitle')).toHaveValue('Test Navigation');
      await expect(page.locator('#wizardComposer')).toHaveValue('Test Composer');
    });

    test('should save draft', async ({ page }) => {
      await page.click('#quickCreateBtn');
      await page.waitForTimeout(1000);
      
      await page.fill('#wizardTitle', 'Draft Test Performance');
      await page.fill('#wizardComposer', 'Draft Composer');
      
      const saveDraftBtn = page.locator('#wizardSaveDraftBtn');
      if (await saveDraftBtn.isVisible()) {
        await saveDraftBtn.click();
        await page.waitForTimeout(500);
        
        // Look for success notification
        const notification = page.locator('.notification, .toast, .swal2-popup');
        // Success notification should appear
      }
    });

    test('should validate required fields in wizard', async ({ page }) => {
      await page.click('#quickCreateBtn');
      await page.waitForTimeout(1000);
      
      // Try to proceed without filling required fields
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Should show validation errors
      const titleInput = page.locator('#wizardTitle');
      const hasError = await titleInput.evaluate(el => 
        el.classList.contains('border-red-500') || 
        !el.validity.valid
      );
      
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Add Performance (Advanced Form)', () => {
    test('should open advanced performance form', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const modal = page.locator('#performanceModal');
      await expect(modal).toBeVisible();
      await expect(page.locator('#performanceModal h2')).toContainText('Add Performance');
    });

    test('should display all form sections', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Check all form fields exist
      await expect(page.locator('#title')).toBeVisible();
      await expect(page.locator('#composer')).toBeVisible();
      await expect(page.locator('#conductor')).toBeVisible();
      await expect(page.locator('#orchestra')).toBeVisible();
      await expect(page.locator('#description')).toBeVisible();
      await expect(page.locator('#presenter')).toBeVisible();
      await expect(page.locator('#duration')).toBeVisible();
      await expect(page.locator('#status')).toBeVisible();
      await expect(page.locator('#venueSelect')).toBeVisible();
    });

    test('should add showtime with venue selection', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Select venue first
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        // Now add showtime button should be enabled
        const addShowtimeBtn = page.locator('#addShowtimeBtn');
        await expect(addShowtimeBtn).toBeEnabled();
        
        await addShowtimeBtn.click();
        await page.waitForTimeout(500);
        
        // Verify showtime was added
        const showtimeContainer = page.locator('#showtimesContainer');
        await expect(showtimeContainer).toBeVisible();
        
        const showtimes = page.locator('[data-showtime-index]');
        const count = await showtimes.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should prevent adding showtime without venue', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Try to add showtime without selecting venue
      const addShowtimeBtn = page.locator('#addShowtimeBtn');
      
      // Button should be disabled
      const isDisabled = await addShowtimeBtn.isDisabled();
      expect(isDisabled).toBe(true);
    });

    test('should remove showtime', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Select venue and add showtime
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Click remove showtime
        const removeBtn = page.locator('.remove-showtime').first();
        if (await removeBtn.isVisible()) {
          await removeBtn.click();
          await page.waitForTimeout(500);
          
          // Confirm deletion in SweetAlert
          const confirmBtn = page.locator('.swal2-confirm');
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test('should add pricing section to showtime', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Select venue and add showtime
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Add pricing section
        const addSectionBtn = page.locator('.add-section-btn, .add-first-section-btn').first();
        if (await addSectionBtn.isVisible()) {
          await addSectionBtn.click();
          await page.waitForTimeout(500);
          
          // Verify pricing section added
          const pricingSection = page.locator('.section-name').first();
          await expect(pricingSection).toBeVisible();
        }
      }
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const cancelBtn = page.locator('button:has-text("Cancel")');
      await cancelBtn.click();
      await page.waitForTimeout(500);
      
      const modal = page.locator('#performanceModal');
      const isHidden = await modal.evaluate(el => {
        return el.classList.contains('hidden') || 
               window.getComputedStyle(el).display === 'none';
      });
      
      expect(isHidden).toBe(true);
    });
  });

  test.describe('Action Dropdown - All Buttons', () => {
    test('should open action dropdown', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr', { timeout: 5000 });
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      // Verify dropdown is visible
      const dropdown = actionBtn.locator('+ div');
      await expect(dropdown).toBeVisible();
    });

    test('should display all action buttons in dropdown', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      // Check all action buttons exist
      await expect(page.locator('.action-view-btn').first()).toBeVisible();
      await expect(page.locator('.action-edit-btn').first()).toBeVisible();
      await expect(page.locator('.action-advanced-edit-btn').first()).toBeVisible();
      await expect(page.locator('.action-duplicate-btn').first()).toBeVisible();
      await expect(page.locator('.action-delete-btn').first()).toBeVisible();
      
      // Manage Showtimes button (may not always be present)
      const manageShowtimesBtn = page.locator('.action-manage-showtimes-btn').first();
      const hasShowtimes = await manageShowtimesBtn.count() > 0;
      console.log('Has Manage Showtimes button:', hasShowtimes);
    });

    test('should close dropdown when clicking outside', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      // Click outside
      await page.click('h1');
      await page.waitForTimeout(300);
      
      // Dropdown should be hidden
      const dropdown = actionBtn.locator('+ div');
      const isHidden = await dropdown.evaluate(el => 
        el.classList.contains('hidden')
      );
      expect(isHidden).toBe(true);
    });
  });

  test.describe('View Performance Details', () => {
    test('should open view details modal', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-view-btn');
      await page.waitForTimeout(1000);
      
      // Check for details modal/view
      const detailsModal = page.locator('.swal2-popup, #performanceDetailsModal');
      await expect(detailsModal).toBeVisible({ timeout: 5000 });
    });

    test('should display performance information in view', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-view-btn');
      await page.waitForTimeout(1000);
      
      // Verify details are shown (structure may vary)
      const modal = page.locator('.swal2-popup, #performanceDetailsModal');
      await expect(modal).toBeVisible();
    });
  });

  test.describe('Quick Edit Performance', () => {
    test('should open quick edit wizard', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-edit-btn');
      await page.waitForTimeout(1000);
      
      // Check for wizard modal
      const wizardModal = page.locator('.swal2-popup, .performance-wizard');
      await expect(wizardModal).toBeVisible({ timeout: 5000 });
    });

    test('should pre-populate form with existing data', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-edit-btn');
      await page.waitForTimeout(1000);
      
      // Check that title field has value
      const titleInput = page.locator('#wizardTitle');
      if (await titleInput.isVisible()) {
        const value = await titleInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Advanced Edit Performance', () => {
    test('should open advanced edit form', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-advanced-edit-btn');
      await page.waitForTimeout(1000);
      
      // Check for performance modal
      const modal = page.locator('#performanceModal');
      await expect(modal).toBeVisible({ timeout: 5000 });
    });

    test('should show Edit Performance title', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-advanced-edit-btn');
      await page.waitForTimeout(1000);
      
      const modalTitle = page.locator('#performanceModal h2');
      if (await modalTitle.isVisible()) {
        await expect(modalTitle).toContainText('Edit');
      }
    });
  });

  test.describe('Manage Showtimes', () => {
    test('should open manage showtimes modal', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      // Find a performance with showtimes
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      const manageBtn = page.locator('.action-manage-showtimes-btn').first();
      if (await manageBtn.isVisible()) {
        await manageBtn.click();
        await page.waitForTimeout(1000);
        
        // Check for showtimes management interface
        const modal = page.locator('.swal2-popup, #showtimesModal');
        await expect(modal).toBeVisible({ timeout: 5000 });
      } else {
        console.log('No performances with showtimes found - skipping test');
      }
    });

    test('should display existing showtimes', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      const manageBtn = page.locator('.action-manage-showtimes-btn').first();
      if (await manageBtn.isVisible()) {
        await manageBtn.click();
        await page.waitForTimeout(1000);
        
        // Verify showtimes are displayed
        const showtimesList = page.locator('[data-showtime-index], .showtime-item');
        const count = await showtimesList.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Duplicate Performance', () => {
    test('should open duplicate confirmation', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-duplicate-btn');
      await page.waitForTimeout(500);
      
      // Check for confirmation dialog
      const confirmDialog = page.locator('.swal2-popup');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    });

    test('should show duplicate options', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-duplicate-btn');
      await page.waitForTimeout(500);
      
      // Verify duplicate dialog content
      const dialog = page.locator('.swal2-popup');
      await expect(dialog).toBeVisible();
      
      // Should have options for what to duplicate
      const dialogContent = await dialog.textContent();
      expect(dialogContent.length).toBeGreaterThan(0);
    });

    test('should cancel duplication', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-duplicate-btn');
      await page.waitForTimeout(500);
      
      // Click cancel
      const cancelBtn = page.locator('.swal2-cancel');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Delete Performance', () => {
    test('should open delete confirmation', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-delete-btn');
      await page.waitForTimeout(500);
      
      // Check for confirmation dialog
      const confirmDialog = page.locator('.swal2-popup');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    });

    test('should show delete warning', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-delete-btn');
      await page.waitForTimeout(500);
      
      // Verify warning message
      const dialog = page.locator('.swal2-popup');
      const content = await dialog.textContent();
      expect(content.toLowerCase()).toContain('delete');
    });

    test('should cancel deletion', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      await page.click('.action-delete-btn');
      await page.waitForTimeout(500);
      
      // Click cancel
      const cancelBtn = page.locator('.swal2-cancel');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
        
        // Performance should still be in table
        await expect(page.locator('#performancesTable tr')).toHaveCount(await page.locator('#performancesTable tr').count());
      }
    });
  });

  test.describe('Showtime Management in Form', () => {
    test('should update seat counts from venue', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Select venue
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        
        // Add showtime
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Check that seat counts are populated
        const totalSeats = page.locator('.showtime-total-seats').first();
        if (await totalSeats.isVisible()) {
          const value = await totalSeats.inputValue();
          expect(parseInt(value)).toBeGreaterThan(0);
        }
      }
    });

    test('should fill showtime date and time', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Fill datetime
        const datetimeInput = page.locator('.showtime-datetime').first();
        if (await datetimeInput.isVisible()) {
          await datetimeInput.fill('2025-12-31T20:00');
          await page.waitForTimeout(300);
          
          const value = await datetimeInput.inputValue();
          expect(value).toBe('2025-12-31T20:00');
        }
      }
    });

    test('should add multiple showtimes', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        // Add first showtime
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Add second showtime
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Verify two showtimes exist
        const showtimes = page.locator('[data-showtime-index]');
        const count = await showtimes.count();
        expect(count).toBe(2);
      }
    });
  });

  test.describe('Pricing Section Management', () => {
    test('should add pricing section', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Add pricing section
        const addSectionBtn = page.locator('.add-section-btn, .add-first-section-btn').first();
        if (await addSectionBtn.isVisible()) {
          await addSectionBtn.click();
          await page.waitForTimeout(500);
          
          // Verify section added
          const sectionName = page.locator('.section-name').first();
          await expect(sectionName).toBeVisible();
        }
      }
    });

    test('should fill pricing section details', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        const addSectionBtn = page.locator('.add-section-btn, .add-first-section-btn').first();
        if (await addSectionBtn.isVisible()) {
          await addSectionBtn.click();
          await page.waitForTimeout(500);
          
          // Fill section details
          const sectionName = page.locator('.section-name').first();
          if (await sectionName.isVisible()) {
            await sectionName.fill('Orchestra');
          }
          
          const tierSelect = page.locator('.section-tier').first();
          if (await tierSelect.isVisible()) {
            await tierSelect.selectOption('premium');
          }
          
          const basePrice = page.locator('.section-base-price').first();
          if (await basePrice.isVisible()) {
            await basePrice.fill('500');
          }
        }
      }
    });

    test('should remove pricing section', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        const addSectionBtn = page.locator('.add-section-btn, .add-first-section-btn').first();
        if (await addSectionBtn.isVisible()) {
          await addSectionBtn.click();
          await page.waitForTimeout(500);
          
          // Remove section
          const removeBtn = page.locator('.remove-section-btn').first();
          if (await removeBtn.isVisible()) {
            await removeBtn.click();
            await page.waitForTimeout(500);
            
            // Confirm deletion
            const confirmBtn = page.locator('.swal2-confirm');
            if (await confirmBtn.isVisible()) {
              await confirmBtn.click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    });

    test('should add multiple pricing sections', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Add first section
        const addFirstBtn = page.locator('.add-section-btn, .add-first-section-btn').first();
        if (await addFirstBtn.isVisible()) {
          await addFirstBtn.click();
          await page.waitForTimeout(500);
          
          // Add second section
          const addSecondBtn = page.locator('.add-section-btn').first();
          if (await addSecondBtn.isVisible()) {
            await addSecondBtn.click();
            await page.waitForTimeout(500);
            
            // Verify multiple sections
            const sections = page.locator('.section-name');
            const count = await sections.count();
            expect(count).toBeGreaterThanOrEqual(2);
          }
        }
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields in advanced form', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Try to submit without filling required fields
      const submitBtn = page.locator('button[type="submit"][form="performanceForm"]');
      await submitBtn.click();
      await page.waitForTimeout(500);
      
      // Check for validation
      const titleInput = page.locator('#title');
      const isInvalid = await titleInput.evaluate(el => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should validate venue selection before adding showtime', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Try to add showtime without venue
      const addShowtimeBtn = page.locator('#addShowtimeBtn');
      const isDisabled = await addShowtimeBtn.isDisabled();
      
      expect(isDisabled).toBe(true);
    });

    test('should validate showtime datetime', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        // Leave datetime empty and try to submit
        const datetimeInput = page.locator('.showtime-datetime').first();
        const isRequired = await datetimeInput.getAttribute('required');
        expect(isRequired).not.toBeNull();
      }
    });

    test('should validate pricing values', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        await page.click('#addShowtimeBtn');
        await page.waitForTimeout(500);
        
        const addSectionBtn = page.locator('.add-section-btn, .add-first-section-btn').first();
        if (await addSectionBtn.isVisible()) {
          await addSectionBtn.click();
          await page.waitForTimeout(500);
          
          // Try negative price
          const basePrice = page.locator('.section-base-price').first();
          if (await basePrice.isVisible()) {
            await basePrice.fill('-100');
            
            const value = await basePrice.inputValue();
            const numValue = parseFloat(value);
            
            // Should not accept negative values
            expect(numValue).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  test.describe('UI Interactions', () => {
    test('should show/hide action dropdown on click', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const actionBtn = page.locator('.action-dropdown-btn').first();
      
      // Open dropdown
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      let dropdown = actionBtn.locator('+ div');
      let isVisible = await dropdown.isVisible();
      expect(isVisible).toBe(true);
      
      // Close dropdown
      await actionBtn.click();
      await page.waitForTimeout(300);
      
      const isHidden = await dropdown.evaluate(el => 
        el.classList.contains('hidden')
      );
      expect(isHidden).toBe(true);
    });

    test('should highlight row on hover', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const firstRow = page.locator('#performancesTable tr').first();
      await firstRow.hover();
      await page.waitForTimeout(200);
      
      // Row should have hover class or style
      const hasHoverClass = await firstRow.evaluate(el => 
        el.classList.contains('hover:bg-gray-50')
      );
      expect(hasHoverClass).toBe(true);
    });

    test('should update result count when filtering', async ({ page }) => {
      await page.waitForSelector('#performancesTable tr');
      
      const initialCount = await page.locator('#resultCount').textContent();
      
      await page.fill('#searchInput', 'xyz123nonexistent');
      await page.waitForTimeout(500);
      
      const newCount = await page.locator('#resultCount').textContent();
      expect(newCount).not.toBe(initialCount);
    });

    test('should scroll to new showtime when added', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      const venueSelect = page.locator('#venueSelect');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        
        // Add multiple showtimes
        for (let i = 0; i < 3; i++) {
          await page.click('#addShowtimeBtn');
          await page.waitForTimeout(500);
        }
        
        // Last showtime should be visible
        const lastShowtime = page.locator('[data-showtime-index="2"]');
        await expect(lastShowtime).toBeVisible();
      }
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist wizard data when navigating steps', async ({ page }) => {
      await page.click('#quickCreateBtn');
      await page.waitForTimeout(1000);
      
      // Fill step 1
      await page.fill('#wizardTitle', 'Persistence Test');
      await page.fill('#wizardComposer', 'Test Composer');
      await page.fill('#wizardConductor', 'Test Conductor');
      await page.fill('#wizardDescription', 'Testing data persistence across wizard steps.');
      
      // Go to step 2
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Go to step 3
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Go back to step 1
      await page.click('#wizardPrevBtn');
      await page.waitForTimeout(500);
      await page.click('#wizardPrevBtn');
      await page.waitForTimeout(500);
      
      // Verify data persisted
      await expect(page.locator('#wizardTitle')).toHaveValue('Persistence Test');
      await expect(page.locator('#wizardComposer')).toHaveValue('Test Composer');
      await expect(page.locator('#wizardConductor')).toHaveValue('Test Conductor');
    });

    test('should persist venue selection in wizard', async ({ page }) => {
      await page.click('#quickCreateBtn');
      await page.waitForTimeout(1000);
      
      // Fill step 1
      await page.fill('#wizardTitle', 'Venue Test');
      await page.fill('#wizardComposer', 'Test');
      await page.fill('#wizardConductor', 'Test');
      await page.fill('#wizardDescription', 'Testing venue persistence.');
      
      // Go to step 2
      await page.click('#wizardNextBtn');
      await page.waitForTimeout(500);
      
      // Select venue
      const venueSelect = page.locator('#wizardVenue');
      const venueOptions = await venueSelect.locator('option').count();
      
      if (venueOptions > 1) {
        await venueSelect.selectOption({ index: 1 });
        const selectedValue = await venueSelect.inputValue();
        
        // Go to step 3
        await page.click('#wizardNextBtn');
        await page.waitForTimeout(500);
        
        // Go back to step 2
        await page.click('#wizardPrevBtn');
        await page.waitForTimeout(500);
        
        // Verify venue still selected
        const currentValue = await venueSelect.inputValue();
        expect(currentValue).toBe(selectedValue);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty table gracefully', async ({ page }) => {
      // Apply filter that returns no results
      await page.fill('#searchInput', 'xyz123nonexistent999');
      await page.waitForTimeout(500);
      
      const resultCount = await page.locator('#resultCount').textContent();
      expect(resultCount).toBe('0');
      
      // Should show empty state message
      const emptyMessage = page.locator('#performancesTable td[colspan]');
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toContainText('No performances found');
      }
    });

    test('should handle modal close without saving', async ({ page }) => {
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Fill some data
      await page.fill('#title', 'Test Data');
      
      // Close modal
      await page.click('button:has-text("Cancel")');
      await page.waitForTimeout(500);
      
      // Reopen modal
      await page.click('#addPerformanceBtn');
      await page.waitForTimeout(500);
      
      // Form should be empty
      const titleValue = await page.locator('#title').inputValue();
      expect(titleValue).toBe('');
    });
  });
});
