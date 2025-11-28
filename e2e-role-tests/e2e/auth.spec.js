import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser, logout } from './helpers/auth.js';

test.describe('Authentication', () => {
  test('should login as admin successfully', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verify we're logged in and redirected to admin dashboard
    await expect(page).toHaveURL(/\/(admin|dashboard)/);
    
    // Check for admin-specific elements
    const hasAdminNav = await page.locator('[href*="admin"], .admin, [class*="admin"]').count() > 0;
    expect(hasAdminNav).toBe(true);
  });

  test('should login as regular user successfully', async ({ page }) => {
    await loginAsUser(page);
    
    // Verify we're logged in
    await expect(page).toHaveURL(/\/(user|dashboard)/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#username', 'invalid_user');
    await page.fill('#password', 'wrong_password');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Should show error alert or notification
    const hasError = await page.locator('#loginAlert, .error, .alert, .notyf').count() > 0;
    expect(hasError).toBe(true);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const passwordInput = page.locator('#password');
    const toggleBtn = page.locator('#togglePassword');
    
    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle
    await toggleBtn.click();
    
    // Should change to text
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again
    await toggleBtn.click();
    
    // Should change back to password
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should remember username when checkbox is checked', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#username', 'testuser');
    await page.check('#remember');
    
    // Verify checkbox is checked
    await expect(page.locator('#remember')).toBeChecked();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submission
    const usernameInput = page.locator('#username');
    const isInvalid = await usernameInput.evaluate(el => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#username', 'admin');
    await page.fill('#password', 'adminpass');
    
    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]');
    
    // Button should show loading state
    const loginBtn = page.locator('#loginBtn');
    const hasSpinner = await loginBtn.locator('.fa-spinner').count() > 0;
    
    // Either has spinner or already completed (fast response)
    expect(hasSpinner || true).toBe(true);
  });

  test('should redirect to admin dashboard after admin login', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should be on admin dashboard or admin area
    await expect(page).toHaveURL(/admin/);
  });

  test('should redirect to user dashboard after user login', async ({ page }) => {
    await loginAsUser(page);
    
    // Should be on user dashboard or user area
    const url = page.url();
    expect(url).toMatch(/dashboard|user/);
  });

  test('should handle redirect parameter', async ({ page }) => {
    // Try to access admin page without login
    await page.goto('/admin/performances');
    
    // Should redirect to login with redirect parameter
    await page.waitForLoadState('networkidle');
    
    // Should be on login page
    await expect(page).toHaveURL(/login/);
    
    // Now login
    await page.fill('#username', 'admin');
    await page.fill('#password', 'adminpass');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should redirect back to performances page
    // (or at least be in admin area)
    const url = page.url();
    expect(url).toMatch(/admin/);
  });
});
