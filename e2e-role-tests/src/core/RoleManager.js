/**
 * Role Manager - Handles authentication and role-specific testing
 */
export class RoleManager {
  constructor(mcpClient, errorCapture, pageNavigator, workflowExecutor, config) {
    this.mcpClient = mcpClient;
    this.errorCapture = errorCapture;
    this.pageNavigator = pageNavigator;
    this.workflowExecutor = workflowExecutor;
    this.config = config;
    this.currentRole = null;
    this.isAuthenticated = false;

    // Define role configurations
    this.ROLES = {
      ADMIN: {
        name: 'admin',
        credentials: config.roles.admin,
        pages: [
          '/admin/dashboard',
          '/admin/performances',
          '/admin/bookings',
          '/admin/users',
          '/admin/venues'
        ],
        workflows: ['createPerformance', 'manageUsers', 'viewBookings', 'manageVenues'],
        restrictedFrom: []
      },
      USER: {
        name: 'user',
        credentials: config.roles.user,
        pages: [
          '/user/dashboard',
          '/user/bookings',
          '/user/profile',
          '/booking'
        ],
        workflows: ['createBooking', 'viewProfile', 'updateProfile'],
        restrictedFrom: ['/admin/dashboard', '/admin/users', '/admin/performances']
      },
      GUEST: {
        name: 'guest',
        credentials: null,
        pages: [
          '/',
          '/login',
          '/register',
          '/performances'
        ],
        workflows: ['viewPublicPages', 'attemptRestrictedAccess', 'testLoginRedirect'],
        restrictedFrom: ['/admin/dashboard', '/user/dashboard', '/user/bookings']
      }
    };
  }

  /**
   * Authenticate as a specific role
   */
  async authenticateAs(role) {
    const roleConfig = this.getRoleConfig(role);
    
    if (!roleConfig) {
      throw new Error(`Unknown role: ${role}`);
    }

    if (role === 'guest') {
      this.currentRole = 'guest';
      this.isAuthenticated = false;
      return { success: true, role: 'guest' };
    }

    try {
      // Navigate to login page
      await this.pageNavigator.navigateTo(`${this.config.baseURL}/login`);
      await this.pageNavigator.waitForPageLoad();

      // Take snapshot to find form elements
      const snapshot = await this.mcpClient.takeSnapshot();
      
      // Find username and password fields from snapshot
      // This is a simplified approach - in real implementation, parse snapshot
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
      
      // Look for input fields in snapshot
      const usernameMatch = snapshotText.match(/uid="([^"]+)"[^>]*username|email/i);
      const passwordMatch = snapshotText.match(/uid="([^"]+)"[^>]*password/i);
      const submitMatch = snapshotText.match(/uid="([^"]+)"[^>]*submit|login/i);

      if (!usernameMatch || !passwordMatch) {
        throw new Error('Could not find login form fields in snapshot');
      }

      // Fill in credentials
      await this.mcpClient.fill(usernameMatch[1], roleConfig.credentials.username);
      await this.mcpClient.fill(passwordMatch[1], roleConfig.credentials.password);

      // Submit form
      if (submitMatch) {
        await this.mcpClient.click(submitMatch[1]);
      } else {
        // Try pressing Enter as fallback
        await this.mcpClient.pressKey('Enter');
      }

      // Wait for navigation after login
      await this.pageNavigator.waitForPageLoad();

      // Verify we're logged in by checking URL or page content
      const currentSnapshot = await this.mcpClient.takeSnapshot();
      const currentSnapshotText = typeof currentSnapshot === 'string' ? currentSnapshot : JSON.stringify(currentSnapshot);
      
      if (currentSnapshotText.includes('dashboard') || !currentSnapshotText.includes('login')) {
        this.currentRole = role;
        this.isAuthenticated = true;
        return { success: true, role };
      } else {
        throw new Error('Login verification failed');
      }
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`Authentication failed for ${role}: ${error.message}`);
    }
  }

  /**
   * Get accessible pages for a role
   */
  getAccessiblePages(role) {
    const roleConfig = this.getRoleConfig(role);
    if (!roleConfig) {
      return [];
    }
    return roleConfig.pages.map(page => `${this.config.baseURL}${page}`);
  }

  /**
   * Get workflows for a role
   */
  getWorkflowsForRole(role) {
    const roleConfig = this.getRoleConfig(role);
    if (!roleConfig) {
      return [];
    }
    
    // Filter by enabled workflows in config
    const enabledWorkflows = this.config.workflows.enabled;
    return roleConfig.workflows.filter(w => enabledWorkflows.includes(w));
  }

  /**
   * Test role permissions by attempting to access restricted pages
   */
  async testRolePermissions(role) {
    const roleConfig = this.getRoleConfig(role);
    if (!roleConfig || roleConfig.restrictedFrom.length === 0) {
      return { tested: 0, passed: 0 };
    }

    const results = {
      tested: 0,
      passed: 0,
      failed: 0,
      details: []
    };

    for (const restrictedPage of roleConfig.restrictedFrom) {
      try {
        results.tested++;
        
        // Attempt to navigate to restricted page
        await this.pageNavigator.navigateTo(`${this.config.baseURL}${restrictedPage}`);
        await this.pageNavigator.waitForPageLoad();

        // Check if we were redirected to login
        const snapshot = await this.mcpClient.takeSnapshot();
        const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
        
        const isRedirectedToLogin = snapshotText.includes('login') || 
                                   snapshotText.includes('sign in') ||
                                   snapshotText.includes('unauthorized');

        if (isRedirectedToLogin) {
          results.passed++;
          results.details.push({
            page: restrictedPage,
            status: 'passed',
            message: 'Access correctly denied'
          });
        } else {
          results.failed++;
          results.details.push({
            page: restrictedPage,
            status: 'failed',
            message: 'Access was not denied - security issue!'
          });
          
          // Log as error
          this.errorCapture.captureError({
            type: 'security',
            severity: 'critical',
            message: `Role ${role} was able to access restricted page: ${restrictedPage}`,
            page: restrictedPage,
            role
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          page: restrictedPage,
          status: 'error',
          message: error.message
        });
      }
    }

    return results;
  }

  /**
   * Logout current user
   */
  async logout() {
    if (!this.isAuthenticated) {
      return { success: true, message: 'Not authenticated' };
    }

    try {
      // Try to find and click logout button
      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
      
      const logoutMatch = snapshotText.match(/uid="([^"]+)"[^>]*logout|sign out/i);
      
      if (logoutMatch) {
        await this.mcpClient.click(logoutMatch[1]);
        await this.pageNavigator.waitForPageLoad();
      } else {
        // Navigate to login page as fallback
        await this.pageNavigator.navigateTo(`${this.config.baseURL}/login`);
      }

      this.isAuthenticated = false;
      this.currentRole = null;
      
      return { success: true };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Get role configuration
   */
  getRoleConfig(role) {
    const roleKey = role.toUpperCase();
    return this.ROLES[roleKey] || null;
  }

  /**
   * Check if currently authenticated
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Get current role
   */
  getCurrentRole() {
    return this.currentRole;
  }
}
