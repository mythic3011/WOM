/**
 * Authentication helper for E2E tests
 */

export async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill login form with admin credentials
  await page.fill('#username', 'admin');
  await page.fill('#password', 'adminpass');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

export async function loginAsUser(page, username = 'user', password = 'userpass') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('#username', username);
  await page.fill('#password', password);
  
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

export async function logout(page) {
  // Look for logout button in various locations
  const logoutSelectors = [
    'button:has-text("Logout")',
    'a:has-text("Logout")',
    'button:has-text("Sign Out")',
    'a:has-text("Sign Out")',
    '[data-action="logout"]'
  ];
  
  for (const selector of logoutSelectors) {
    const logoutBtn = page.locator(selector).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
      return;
    }
  }
}
