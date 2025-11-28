/**
 * Page Navigator - Handles page navigation and state verification
 */
export class PageNavigator {
  constructor(mcpClient, errorCapture) {
    this.mcpClient = mcpClient;
    this.errorCapture = errorCapture;
    this.currentURL = null;
    this.pageLoadTimeout = 30000;
    this.elementWaitTimeout = 10000;
  }

  /**
   * Navigate to a URL
   */
  async navigateTo(url, options = {}) {
    try {
      const timeout = options.timeout || this.pageLoadTimeout;
      const ignoreCache = options.ignoreCache || false;

      await this.mcpClient.navigatePage(url, { timeout, ignoreCache });
      this.currentURL = url;

      return { success: true, url };
    } catch (error) {
      await this.errorCapture.captureError({
        type: 'navigation',
        severity: 'high',
        message: `Failed to navigate to ${url}: ${error.message}`,
        page: url,
        context: { url, error: error.message }
      });
      throw error;
    }
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(timeout = null) {
    const waitTimeout = timeout || this.pageLoadTimeout;
    
    try {
      // Wait a bit for page to stabilize
      await this.sleep(2000);

      // Take snapshot to verify page loaded
      const snapshot = await this.mcpClient.takeSnapshot();
      
      if (!snapshot) {
        throw new Error('Page did not load - no snapshot available');
      }

      // Check for console errors after page load
      await this.errorCapture.captureConsoleError(null, {
        page: this.currentURL,
        url: this.currentURL
      });

      // Check for network errors
      await this.errorCapture.captureNetworkError(null, {
        page: this.currentURL,
        url: this.currentURL
      });

      return { success: true };
    } catch (error) {
      await this.errorCapture.captureError({
        type: 'page-load',
        severity: 'high',
        message: `Page load timeout: ${error.message}`,
        page: this.currentURL,
        context: { url: this.currentURL, timeout: waitTimeout }
      });
      throw error;
    }
  }

  /**
   * Take a snapshot of the current page
   */
  async takeSnapshot(options = {}) {
    try {
      const snapshot = await this.mcpClient.takeSnapshot({
        verbose: options.verbose || false,
        filePath: options.filePath
      });
      return snapshot;
    } catch (error) {
      throw new Error(`Failed to take snapshot: ${error.message}`);
    }
  }

  /**
   * Verify page elements exist
   */
  async verifyPageElements(selectors) {
    const results = {
      total: selectors.length,
      found: 0,
      missing: [],
      details: []
    };

    try {
      const snapshot = await this.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      for (const selector of selectors) {
        // Simple check if selector text appears in snapshot
        // In a real implementation, this would parse the snapshot structure
        const found = snapshotText.includes(selector);
        
        if (found) {
          results.found++;
          results.details.push({ selector, found: true });
        } else {
          results.missing.push(selector);
          results.details.push({ selector, found: false });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to verify page elements: ${error.message}`);
    }
  }

  /**
   * Test responsiveness at different viewport sizes
   */
  async testResponsiveness(viewports = null) {
    const defaultViewports = viewports || [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    const results = [];

    for (const viewport of defaultViewports) {
      try {
        // Resize page
        await this.mcpClient.resizePage(viewport.width, viewport.height);
        
        // Wait for resize to take effect
        await this.sleep(1000);

        // Take snapshot
        const snapshot = await this.takeSnapshot();

        results.push({
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          success: true,
          snapshot: snapshot ? 'captured' : 'failed'
        });
      } catch (error) {
        results.push({
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          success: false,
          error: error.message
        });

        await this.errorCapture.captureError({
          type: 'responsiveness',
          severity: 'medium',
          message: `Responsiveness test failed for ${viewport.name}: ${error.message}`,
          page: this.currentURL,
          context: { viewport, url: this.currentURL }
        });
      }
    }

    return results;
  }

  /**
   * Get current URL
   */
  getCurrentURL() {
    return this.currentURL;
  }

  /**
   * Wait for an element to appear
   */
  async waitForElement(selector, timeout = null) {
    const waitTimeout = timeout || this.elementWaitTimeout;
    const startTime = Date.now();

    while (Date.now() - startTime < waitTimeout) {
      try {
        const snapshot = await this.takeSnapshot();
        const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

        if (snapshotText.includes(selector)) {
          return { found: true, selector };
        }

        await this.sleep(500);
      } catch (error) {
        // Continue waiting
      }
    }

    throw new Error(`Element not found within timeout: ${selector}`);
  }

  /**
   * Wait for text to appear on page
   */
  async waitForText(text, timeout = null) {
    const waitTimeout = timeout || this.elementWaitTimeout;
    
    try {
      await this.mcpClient.waitFor(text, waitTimeout);
      return { found: true, text };
    } catch (error) {
      throw new Error(`Text not found within timeout: ${text}`);
    }
  }

  /**
   * Check if page has errors
   */
  async checkForPageErrors() {
    const errors = [];

    try {
      // Check console errors
      const consoleMessages = await this.mcpClient.listConsoleMessages({
        types: ['error']
      });

      if (consoleMessages && consoleMessages.messages) {
        errors.push(...consoleMessages.messages.map(msg => ({
          type: 'console',
          message: msg.text || msg.message
        })));
      }

      // Check network errors
      const networkRequests = await this.mcpClient.listNetworkRequests();

      if (networkRequests && networkRequests.requests) {
        const failedRequests = networkRequests.requests.filter(req => req.status >= 400);
        errors.push(...failedRequests.map(req => ({
          type: 'network',
          message: `${req.method} ${req.url} - ${req.status}`
        })));
      }
    } catch (error) {
      console.warn('Could not check for page errors:', error.message);
    }

    return errors;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scroll to element
   */
  async scrollToElement(uid) {
    try {
      // Hover over element to bring it into view
      await this.mcpClient.hover(uid);
      await this.sleep(500);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to scroll to element: ${error.message}`);
    }
  }

  /**
   * Get page title from snapshot
   */
  async getPageTitle() {
    try {
      const snapshot = await this.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
      
      // Try to extract title from snapshot
      const titleMatch = snapshotText.match(/title["\s:]+([^"}\n]+)/i);
      return titleMatch ? titleMatch[1].trim() : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }
}
