/**
 * Helper functions for performance testing
 */

export async function createPerformance(page, data) {
  await page.click('#addPerformanceBtn');
  await page.waitForSelector('#performanceModal');
  
  // Fill basic info
  if (data.title) await page.fill('#title', data.title);
  if (data.composer) await page.fill('#composer', data.composer);
  if (data.conductor) await page.fill('#conductor', data.conductor);
  if (data.orchestra) await page.fill('#orchestra', data.orchestra);
  if (data.description) await page.fill('#description', data.description);
  
  // Fill performance info
  if (data.presenter) await page.fill('#presenter', data.presenter);
  if (data.duration) await page.fill('#duration', data.duration);
  if (data.status) await page.selectOption('#status', data.status);
  
  // Submit
  await page.click('button[type="submit"][form="performanceForm"]');
  await page.waitForTimeout(1000);
}

export async function editPerformance(page, performanceTitle, updates) {
  // Find performance row
  const row = page.locator(`tr:has-text("${performanceTitle}")`);
  await row.locator('.action-dropdown-btn').click();
  
  // Click edit
  await page.click('button:has-text("Quick Edit")');
  await page.waitForTimeout(500);
  
  // Apply updates
  if (updates.title) await page.fill('#title', updates.title);
  if (updates.composer) await page.fill('#composer', updates.composer);
  if (updates.conductor) await page.fill('#conductor', updates.conductor);
  
  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
}

export async function deletePerformance(page, performanceTitle, confirm = false) {
  const row = page.locator(`tr:has-text("${performanceTitle}")`);
  await row.locator('.action-dropdown-btn').click();
  
  await page.click('button:has-text("Delete")');
  await page.waitForTimeout(500);
  
  if (confirm) {
    // Confirm deletion in SweetAlert
    const confirmBtn = page.locator('.swal2-confirm');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }
  }
}

export async function searchPerformances(page, query) {
  await page.fill('#searchInput', query);
  await page.waitForTimeout(500);
}

export async function filterByStatus(page, status) {
  await page.selectOption('#statusFilter', status);
  await page.waitForTimeout(500);
}

export async function filterByVenue(page, venue) {
  await page.selectOption('#venueFilter', venue);
  await page.waitForTimeout(500);
}

export async function clearFilters(page) {
  await page.click('#clearFilters');
  await page.waitForTimeout(300);
}

export async function getPerformanceCount(page) {
  const countText = await page.locator('#resultCount').textContent();
  return parseInt(countText);
}

export async function addShowtime(page, showtimeData = {}) {
  await page.click('#addShowtimeBtn');
  await page.waitForTimeout(500);
  
  // Fill showtime data if provided
  if (showtimeData.dateTime) {
    const dateTimeInput = page.locator('input[type="datetime-local"]').last();
    if (await dateTimeInput.isVisible()) {
      await dateTimeInput.fill(showtimeData.dateTime);
    }
  }
}

export async function addPricingSection(page, showtimeIndex = 0) {
  const addPricingBtn = page.locator('button:has-text("Add Pricing"), button:has-text("Add Section")').nth(showtimeIndex);
  
  if (await addPricingBtn.isVisible()) {
    await addPricingBtn.click();
    await page.waitForTimeout(300);
  }
}

export const mockPerformanceData = {
  basic: {
    title: 'Test Symphony',
    composer: 'Test Composer',
    conductor: 'Test Conductor',
    orchestra: 'Test Orchestra',
    description: 'Test description',
    duration: '120',
    status: 'upcoming'
  },
  
  complete: {
    title: 'Beethoven Symphony No. 9',
    composer: 'Ludwig van Beethoven',
    conductor: 'Herbert von Karajan',
    orchestra: 'Berlin Philharmonic',
    description: 'The iconic Ninth Symphony featuring the Ode to Joy',
    presenter: 'Hong Kong Philharmonic Orchestra',
    duration: '90',
    status: 'on_sale',
    ageLimit: '6+',
    website: 'https://example.com'
  },
  
  minimal: {
    title: 'Minimal Performance',
    composer: 'Composer',
    conductor: 'Conductor',
    orchestra: 'Orchestra'
  }
};
