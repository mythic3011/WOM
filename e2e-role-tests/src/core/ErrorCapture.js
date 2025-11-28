import path from 'path';
import fs from 'fs/promises';

/**
 * Error Capture System - Monitors and captures all types of frontend errors
 */
export class ErrorCapture {
  constructor(mcpClient) {
    this.mcpClient = mcpClient;
    this.errors = [];
    this.isMonitoring = false;
    this.errorIdCounter = 1;
    this.screenshotDir = './screenshots/errors';
    
    // Error severity definitions
    this.ERROR_SEVERITY = {
      CRITICAL: {
        level: 1,
        keywords: ['uncaught', 'typeerror', 'referenceerror', '500', 'authentication', 'crash']
      },
      HIGH: {
        level: 2,
        keywords: ['error', '404', '403', 'failed', 'exception']
      },
      MEDIUM: {
        level: 3,
        keywords: ['warning', 'deprecated', 'invalid']
      },
      LOW: {
        level: 4,
        keywords: ['info', 'debug', 'notice']
      }
    };
  }

  /**
   * Start monitoring for errors
   */
  async startMonitoring() {
    this.isMonitoring = true;
    this.errors = [];
    
    // Ensure screenshot directory exists
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create screenshot directory:', error.message);
    }
    
    return { success: true };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
  }

  /**
   * Capture a JavaScript error
   */
  async captureJavaScriptError(error, context = {}) {
    if (!this.isMonitoring) return;

    const errorDetail = {
      id: `ERR-${Date.now()}-${this.errorIdCounter++}`,
      timestamp: new Date().toISOString(),
      type: 'javascript',
      severity: this.categorizeSeverity(error.message || error.toString()),
      message: error.message || error.toString(),
      stack: error.stack || null,
      page: context.page || 'unknown',
      role: context.role || 'unknown',
      context: {
        url: context.url || '',
        userAction: context.userAction || '',
        elementSelector: context.elementSelector || null
      },
      reproductionSteps: context.reproductionSteps || []
    };

    // Capture screenshot
    try {
      const screenshotPath = path.join(this.screenshotDir, `${errorDetail.id}.png`);
      await this.captureScreenshot(screenshotPath);
      errorDetail.screenshot = screenshotPath;
    } catch (err) {
      console.warn('Could not capture screenshot:', err.message);
    }

    this.errors.push(errorDetail);
    return errorDetail;
  }

  /**
   * Capture console errors
   */
  async captureConsoleError(log, context = {}) {
    if (!this.isMonitoring) return;

    // Get console messages from MCP
    try {
      const messages = await this.mcpClient.listConsoleMessages({
        types: ['error', 'warn']
      });

      if (messages && messages.messages) {
        for (const msg of messages.messages) {
          const errorDetail = {
            id: `ERR-${Date.now()}-${this.errorIdCounter++}`,
            timestamp: new Date().toISOString(),
            type: 'console',
            severity: this.categorizeConsoleLogSeverity(msg.type),
            message: msg.text || msg.message || 'Console error',
            page: context.page || 'unknown',
            role: context.role || 'unknown',
            context: {
              url: context.url || '',
              consoleType: msg.type,
              source: msg.source || null
            },
            reproductionSteps: context.reproductionSteps || []
          };

          this.errors.push(errorDetail);
        }
      }
    } catch (error) {
      console.warn('Could not capture console messages:', error.message);
    }
  }

  /**
   * Capture network errors
   */
  async captureNetworkError(request, context = {}) {
    if (!this.isMonitoring) return;

    // Get network requests from MCP
    try {
      const requests = await this.mcpClient.listNetworkRequests();

      if (requests && requests.requests) {
        for (const req of requests.requests) {
          // Check for failed requests (4xx, 5xx status codes)
          if (req.status >= 400) {
            const errorDetail = {
              id: `ERR-${Date.now()}-${this.errorIdCounter++}`,
              timestamp: new Date().toISOString(),
              type: 'network',
              severity: req.status >= 500 ? 'critical' : 'high',
              message: `Network request failed: ${req.method} ${req.url}`,
              page: context.page || 'unknown',
              role: context.role || 'unknown',
              context: {
                url: context.url || '',
                networkRequest: {
                  url: req.url,
                  method: req.method,
                  status: req.status,
                  statusText: req.statusText || ''
                }
              },
              reproductionSteps: context.reproductionSteps || []
            };

            // Capture screenshot for network errors
            try {
              const screenshotPath = path.join(this.screenshotDir, `${errorDetail.id}.png`);
              await this.captureScreenshot(screenshotPath);
              errorDetail.screenshot = screenshotPath;
            } catch (err) {
              console.warn('Could not capture screenshot:', err.message);
            }

            this.errors.push(errorDetail);
          }
        }
      }
    } catch (error) {
      console.warn('Could not capture network requests:', error.message);
    }
  }

  /**
   * Capture screenshot
   */
  async captureScreenshot(filePath) {
    try {
      await this.mcpClient.takeScreenshot(filePath, {
        format: 'png',
        quality: 80,
        fullPage: true
      });
      return filePath;
    } catch (error) {
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  }

  /**
   * Capture DOM snapshot
   */
  async captureDOMSnapshot() {
    try {
      const snapshot = await this.mcpClient.takeSnapshot({ verbose: true });
      return snapshot;
    } catch (error) {
      throw new Error(`DOM snapshot capture failed: ${error.message}`);
    }
  }

  /**
   * Categorize error severity based on message content
   */
  categorizeSeverity(message) {
    const lowerMessage = message.toLowerCase();

    for (const [severity, config] of Object.entries(this.ERROR_SEVERITY)) {
      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword)) {
          return severity.toLowerCase();
        }
      }
    }

    return 'medium'; // Default severity
  }

  /**
   * Categorize console log severity
   */
  categorizeConsoleLogSeverity(type) {
    const typeMap = {
      'error': 'high',
      'warn': 'medium',
      'warning': 'medium',
      'info': 'low',
      'log': 'low',
      'debug': 'low'
    };

    return typeMap[type] || 'medium';
  }

  /**
   * Get all captured errors
   */
  getAllErrors() {
    return this.errors;
  }

  /**
   * Get errors categorized by severity
   */
  getCategorizedErrors() {
    const categorized = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    for (const error of this.errors) {
      const severity = error.severity || 'medium';
      if (categorized[severity]) {
        categorized[severity].push(error);
      }
    }

    return categorized;
  }

  /**
   * Get error count by severity
   */
  getErrorCounts() {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: this.errors.length
    };

    for (const error of this.errors) {
      const severity = error.severity || 'medium';
      if (counts[severity] !== undefined) {
        counts[severity]++;
      }
    }

    return counts;
  }

  /**
   * Clear all captured errors
   */
  clearErrors() {
    this.errors = [];
    this.errorIdCounter = 1;
  }

  /**
   * Capture a generic error with context
   */
  captureError(errorData) {
    if (!this.isMonitoring) return;

    const errorDetail = {
      id: `ERR-${Date.now()}-${this.errorIdCounter++}`,
      timestamp: new Date().toISOString(),
      type: errorData.type || 'generic',
      severity: errorData.severity || 'medium',
      message: errorData.message || 'Unknown error',
      page: errorData.page || 'unknown',
      role: errorData.role || 'unknown',
      context: errorData.context || {},
      reproductionSteps: errorData.reproductionSteps || []
    };

    this.errors.push(errorDetail);
    return errorDetail;
  }

  /**
   * Get the last captured error
   */
  getLastError() {
    return this.errors[this.errors.length - 1] || null;
  }
}
