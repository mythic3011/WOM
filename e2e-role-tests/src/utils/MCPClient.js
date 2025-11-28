/**
 * MCP Chrome DevTools Client Wrapper
 * Provides a simplified interface for interacting with MCP Chrome DevTools
 * 
 * NOTE: This must be run within Kiro's environment where MCP tools are available
 */
export class MCPClient {
  constructor() {
    this.currentPageIndex = 0;
    this.isConnected = false;
    
    // Check if MCP tools are available
    if (typeof globalThis.mcp_chrome_devtools_list_pages === 'undefined') {
      throw new Error(
        'MCP Chrome DevTools tools are not available. ' +
        'This test system must be run within Kiro\'s environment. ' +
        'Please run this through Kiro, not as a standalone Node.js script.'
      );
    }
  }

  /**
   * Initialize MCP connection
   */
  async initialize() {
    try {
      // List available pages to verify connection
      const pages = await globalThis.mcp_chrome_devtools_list_pages();
      this.isConnected = true;
      return { success: true, pages };
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to initialize MCP connection: ${error.message}`);
    }
  }

  /**
   * Navigate to a URL
   */
  async navigatePage(url, options = {}) {
    try {
      const result = await globalThis.mcp_chrome_devtools_navigate_page({
        type: 'url',
        url,
        timeout: options.timeout || 30000,
        ignoreCache: options.ignoreCache || false
      });
      return result;
    } catch (error) {
      throw new Error(`Navigation failed to ${url}: ${error.message}`);
    }
  }

  /**
   * Take a snapshot of the current page
   */
  async takeSnapshot(options = {}) {
    try {
      const result = await globalThis.mcp_chrome_devtools_take_snapshot({
        verbose: options.verbose || false,
        filePath: options.filePath
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to take snapshot: ${error.message}`);
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(filePath, options = {}) {
    try {
      const result = await globalThis.mcp_chrome_devtools_take_screenshot({
        filePath,
        format: options.format || 'png',
        quality: options.quality || 80,
        fullPage: options.fullPage || false
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  /**
   * Click an element by UID
   */
  async click(uid, options = {}) {
    try {
      const result = await globalThis.mcp_chrome_devtools_click({
        uid,
        dblClick: options.dblClick || false
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to click element ${uid}: ${error.message}`);
    }
  }

  /**
   * Fill a form field
   */
  async fill(uid, value) {
    try {
      const result = await globalThis.mcp_chrome_devtools_fill({ uid, value });
      return result;
    } catch (error) {
      throw new Error(`Failed to fill element ${uid}: ${error.message}`);
    }
  }

  /**
   * Fill multiple form fields at once
   */
  async fillForm(elements) {
    try {
      const result = await globalThis.mcp_chrome_devtools_fill_form({ elements });
      return result;
    } catch (error) {
      throw new Error(`Failed to fill form: ${error.message}`);
    }
  }

  /**
   * Wait for text to appear on page
   */
  async waitFor(text, timeout = 10000) {
    try {
      const result = await globalThis.mcp_chrome_devtools_wait_for({ text, timeout });
      return result;
    } catch (error) {
      throw new Error(`Timeout waiting for text "${text}": ${error.message}`);
    }
  }

  /**
   * List console messages
   */
  async listConsoleMessages(options = {}) {
    try {
      const result = await globalThis.mcp_chrome_devtools_list_console_messages({
        types: options.types,
        pageIdx: options.pageIdx,
        pageSize: options.pageSize,
        includePreservedMessages: options.includePreservedMessages || false
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to list console messages: ${error.message}`);
    }
  }

  /**
   * Get a specific console message
   */
  async getConsoleMessage(msgid) {
    try {
      const result = await globalThis.mcp_chrome_devtools_get_console_message({ msgid });
      return result;
    } catch (error) {
      throw new Error(`Failed to get console message ${msgid}: ${error.message}`);
    }
  }

  /**
   * List network requests
   */
  async listNetworkRequests(options = {}) {
    try {
      const result = await globalThis.mcp_chrome_devtools_list_network_requests({
        resourceTypes: options.resourceTypes,
        pageIdx: options.pageIdx,
        pageSize: options.pageSize,
        includePreservedRequests: options.includePreservedRequests || false
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to list network requests: ${error.message}`);
    }
  }

  /**
   * Get a specific network request
   */
  async getNetworkRequest(reqid) {
    try {
      const result = await globalThis.mcp_chrome_devtools_get_network_request({ reqid });
      return result;
    } catch (error) {
      throw new Error(`Failed to get network request ${reqid}: ${error.message}`);
    }
  }

  /**
   * List available pages
   */
  async listPages() {
    try {
      const result = await globalThis.mcp_chrome_devtools_list_pages();
      return result;
    } catch (error) {
      throw new Error(`Failed to list pages: ${error.message}`);
    }
  }

  /**
   * Select a page by index
   */
  async selectPage(pageIdx) {
    try {
      const result = await globalThis.mcp_chrome_devtools_select_page({ pageIdx });
      this.currentPageIndex = pageIdx;
      return result;
    } catch (error) {
      throw new Error(`Failed to select page ${pageIdx}: ${error.message}`);
    }
  }

  /**
   * Create a new page
   */
  async newPage(url, timeout = 30000) {
    try {
      const result = await globalThis.mcp_chrome_devtools_new_page({ url, timeout });
      return result;
    } catch (error) {
      throw new Error(`Failed to create new page: ${error.message}`);
    }
  }

  /**
   * Close a page
   */
  async closePage(pageIdx) {
    try {
      const result = await globalThis.mcp_chrome_devtools_close_page({ pageIdx });
      return result;
    } catch (error) {
      throw new Error(`Failed to close page ${pageIdx}: ${error.message}`);
    }
  }

  /**
   * Press a key or key combination
   */
  async pressKey(key) {
    try {
      const result = await globalThis.mcp_chrome_devtools_press_key({ key });
      return result;
    } catch (error) {
      throw new Error(`Failed to press key ${key}: ${error.message}`);
    }
  }

  /**
   * Hover over an element
   */
  async hover(uid) {
    try {
      const result = await globalThis.mcp_chrome_devtools_hover({ uid });
      return result;
    } catch (error) {
      throw new Error(`Failed to hover element ${uid}: ${error.message}`);
    }
  }

  /**
   * Handle browser dialog
   */
  async handleDialog(action, promptText = null) {
    try {
      const result = await globalThis.mcp_chrome_devtools_handle_dialog({
        action,
        promptText
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to handle dialog: ${error.message}`);
    }
  }

  /**
   * Resize page
   */
  async resizePage(width, height) {
    try {
      const result = await globalThis.mcp_chrome_devtools_resize_page({ width, height });
      return result;
    } catch (error) {
      throw new Error(`Failed to resize page: ${error.message}`);
    }
  }

  /**
   * Check if MCP is connected
   */
  isReady() {
    return this.isConnected;
  }
}
