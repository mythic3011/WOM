import fs from 'fs/promises';
import path from 'path';

/**
 * Report Generator - Compiles test results and generates reports
 */
export class ReportGenerator {
  constructor(testResults, errors, config) {
    this.testResults = testResults;
    this.errors = errors;
    this.config = config;
    this.outputDir = config.output.directory || './test-results';
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport() {
    const reportPath = path.join(this.outputDir, 'reports', 'test-report.html');
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    const html = this.buildHTMLReport();
    await fs.writeFile(reportPath, html, 'utf8');

    return reportPath;
  }

  /**
   * Build HTML report content
   */
  buildHTMLReport() {
    const summary = this.getSummary();
    const errorsByRole = this.groupErrorsByRole();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Role Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f9f9f9; padding: 20px; border-radius: 5px; border-left: 4px solid #4CAF50; }
        .stat-card.failed { border-left-color: #f44336; }
        .stat-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
        .stat-card .value { font-size: 32px; font-weight: bold; color: #333; }
        .role-section { margin: 30px 0; padding: 20px; background: #fafafa; border-radius: 5px; }
        .error-list { list-style: none; padding: 0; }
        .error-item { background: white; margin: 10px 0; padding: 15px; border-left: 4px solid #ff9800; border-radius: 3px; }
        .error-item.critical { border-left-color: #f44336; }
        .error-item.high { border-left-color: #ff9800; }
        .error-item.medium { border-left-color: #ffc107; }
        .error-item.low { border-left-color: #4CAF50; }
        .error-header { font-weight: bold; color: #333; margin-bottom: 5px; }
        .error-message { color: #666; margin: 5px 0; }
        .error-meta { font-size: 12px; color: #999; margin-top: 10px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .badge.passed { background: #4CAF50; color: white; }
        .badge.failed { background: #f44336; color: white; }
        .badge.critical { background: #f44336; color: white; }
        .badge.high { background: #ff9800; color: white; }
        .badge.medium { background: #ffc107; color: #333; }
        .badge.low { background: #4CAF50; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>UI Role Testing Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <h2>Summary</h2>
        <div class="summary">
            <div class="stat-card">
                <h3>Total Tests</h3>
                <div class="value">${summary.totalTests}</div>
            </div>
            <div class="stat-card">
                <h3>Passed</h3>
                <div class="value">${summary.passed}</div>
            </div>
            <div class="stat-card ${summary.failed > 0 ? 'failed' : ''}">
                <h3>Failed</h3>
                <div class="value">${summary.failed}</div>
            </div>
            <div class="stat-card ${summary.totalErrors > 0 ? 'failed' : ''}">
                <h3>Errors Found</h3>
                <div class="value">${summary.totalErrors}</div>
            </div>
            <div class="stat-card">
                <h3>Duration</h3>
                <div class="value">${summary.durationFormatted}</div>
            </div>
        </div>

        ${this.buildRoleSections(errorsByRole)}
        
        ${this.buildErrorSummary()}
    </div>
</body>
</html>`;
  }

  /**
   * Build role sections for HTML report
   */
  buildRoleSections(errorsByRole) {
    let html = '<h2>Results by Role</h2>';

    for (const result of this.testResults) {
      const status = result.status === 'completed' ? 'passed' : 'failed';
      html += `
        <div class="role-section">
            <h3>${result.role.toUpperCase()} <span class="badge ${status}">${status}</span></h3>
            <p>Pages Visited: ${result.pagesVisited || 0}</p>
            <p>Workflows Executed: ${result.workflowsExecuted || 0}</p>
            <p>Errors: ${result.errors?.length || 0}</p>
            <p>Duration: ${result.duration ? (result.duration / 1000).toFixed(2) + 's' : 'N/A'}</p>
        </div>
      `;
    }

    return html;
  }

  /**
   * Build error summary for HTML report
   */
  buildErrorSummary() {
    if (this.errors.length === 0) {
      return '<h2>Errors</h2><p>No errors found! 🎉</p>';
    }

    let html = '<h2>Errors</h2><ul class="error-list">';

    for (const error of this.errors) {
      html += `
        <li class="error-item ${error.severity}">
            <div class="error-header">
                <span class="badge ${error.severity}">${error.severity}</span>
                ${error.type} - ${error.id}
            </div>
            <div class="error-message">${error.message}</div>
            <div class="error-meta">
                Page: ${error.page} | Role: ${error.role} | Time: ${error.timestamp}
            </div>
        </li>
      `;
    }

    html += '</ul>';
    return html;
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport() {
    const reportPath = path.join(this.outputDir, 'reports', 'test-report.json');
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    const report = {
      summary: this.getSummary(),
      testResults: this.testResults,
      errors: this.errors,
      errorsByRole: this.groupErrorsByRole(),
      errorsBySeverity: this.groupErrorsBySeverity()
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

    return reportPath;
  }

  /**
   * Generate Markdown summary
   */
  async generateMarkdownSummary() {
    const reportPath = path.join(this.outputDir, 'reports', 'test-summary.md');
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    const summary = this.getSummary();
    const markdown = `# UI Role Testing Summary

**Generated:** ${new Date().toLocaleString()}

## Summary Statistics

- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passed}
- **Failed:** ${summary.failed}
- **Errors Found:** ${summary.totalErrors}
- **Duration:** ${summary.durationFormatted}

## Results by Role

${this.buildMarkdownRoleSections()}

## Errors by Severity

${this.buildMarkdownErrorSummary()}

## Suggested Fixes

${this.buildMarkdownFixSuggestions()}
`;

    await fs.writeFile(reportPath, markdown, 'utf8');

    return reportPath;
  }

  /**
   * Build role sections for Markdown
   */
  buildMarkdownRoleSections() {
    let markdown = '';

    for (const result of this.testResults) {
      const status = result.status === 'completed' ? '✅ PASSED' : '❌ FAILED';
      markdown += `### ${result.role.toUpperCase()} ${status}

- Pages Visited: ${result.pagesVisited || 0}
- Workflows Executed: ${result.workflowsExecuted || 0}
- Errors: ${result.errors?.length || 0}
- Duration: ${result.duration ? (result.duration / 1000).toFixed(2) + 's' : 'N/A'}

`;
    }

    return markdown;
  }

  /**
   * Build error summary for Markdown
   */
  buildMarkdownErrorSummary() {
    if (this.errors.length === 0) {
      return 'No errors found! 🎉';
    }

    const bySeverity = this.groupErrorsBySeverity();
    let markdown = '';

    for (const [severity, errors] of Object.entries(bySeverity)) {
      if (errors.length > 0) {
        markdown += `### ${severity.toUpperCase()} (${errors.length})\n\n`;
        
        for (const error of errors.slice(0, 5)) {
          markdown += `- **${error.type}**: ${error.message}\n`;
          markdown += `  - Page: ${error.page}\n`;
          markdown += `  - Role: ${error.role}\n\n`;
        }

        if (errors.length > 5) {
          markdown += `_... and ${errors.length - 5} more ${severity} errors_\n\n`;
        }
      }
    }

    return markdown;
  }

  /**
   * Build fix suggestions for Markdown
   */
  buildMarkdownFixSuggestions() {
    const fixes = this.suggestFixes(this.errors);
    
    if (fixes.length === 0) {
      return 'No fix suggestions available.';
    }

    let markdown = '';

    for (const fix of fixes.slice(0, 10)) {
      markdown += `### ${fix.errorId}\n\n`;
      markdown += `**Issue:** ${fix.description}\n\n`;
      markdown += `**Suggested Fix:** ${fix.suggestedFix}\n\n`;
      markdown += `**Priority:** ${fix.priority}\n\n`;
      
      if (fix.affectedFiles && fix.affectedFiles.length > 0) {
        markdown += `**Affected Files:**\n`;
        for (const file of fix.affectedFiles) {
          markdown += `- ${file}\n`;
        }
        markdown += '\n';
      }
    }

    return markdown;
  }

  /**
   * Suggest fixes for errors
   */
  suggestFixes(errors) {
    const fixes = [];

    for (const error of errors) {
      const fix = {
        errorId: error.id,
        description: error.message,
        suggestedFix: this.generateFixSuggestion(error),
        priority: error.severity,
        affectedFiles: this.identifyAffectedFiles(error)
      };

      fixes.push(fix);
    }

    return fixes;
  }

  /**
   * Generate fix suggestion based on error pattern
   */
  generateFixSuggestion(error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') && message.includes('500')) {
      return 'Check server-side error handling. Add try-catch blocks and proper error responses.';
    }

    if (message.includes('network') && message.includes('404')) {
      return 'Verify API endpoint exists and route is correctly configured.';
    }

    if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'Check authentication middleware and session management.';
    }

    if (message.includes('element not found') || message.includes('selector')) {
      return 'Verify element selector is correct and element exists in DOM.';
    }

    if (message.includes('timeout')) {
      return 'Increase timeout value or optimize page load performance.';
    }

    if (message.includes('console error')) {
      return 'Check browser console for JavaScript errors and fix them.';
    }

    return 'Review error details and implement appropriate fix.';
  }

  /**
   * Identify affected files based on error
   */
  identifyAffectedFiles(error) {
    const files = [];

    if (error.type === 'network') {
      files.push('backend/src/controllers/*');
      files.push('backend/src/routes/*');
    }

    if (error.type === 'javascript') {
      files.push('frontend/src/**/*.js');
      files.push('frontend/src/**/*.vue');
    }

    if (error.type === 'console') {
      files.push('frontend/src/**/*');
    }

    return files;
  }

  /**
   * Export screenshots
   */
  async exportScreenshots() {
    const screenshotDir = path.join(this.outputDir, 'screenshots');
    await fs.mkdir(screenshotDir, { recursive: true });

    // Screenshots are already saved by ErrorCapture
    return screenshotDir;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const totalTests = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'completed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const totalErrors = this.errors.length;

    const durations = this.testResults
      .filter(r => r.duration)
      .map(r => r.duration);
    
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      totalTests,
      passed,
      failed,
      totalErrors,
      duration: totalDuration,
      durationFormatted: `${(totalDuration / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Group errors by role
   */
  groupErrorsByRole() {
    const grouped = {};

    for (const error of this.errors) {
      const role = error.role || 'unknown';
      if (!grouped[role]) {
        grouped[role] = [];
      }
      grouped[role].push(error);
    }

    return grouped;
  }

  /**
   * Group errors by severity
   */
  groupErrorsBySeverity() {
    const grouped = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    for (const error of this.errors) {
      const severity = error.severity || 'medium';
      if (grouped[severity]) {
        grouped[severity].push(error);
      }
    }

    return grouped;
  }
}
