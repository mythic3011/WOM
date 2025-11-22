import { MCPClient } from '../utils/MCPClient.js';
import { RoleManager } from './RoleManager.js';
import { ErrorCapture } from './ErrorCapture.js';
import { PageNavigator } from './PageNavigator.js';
import { WorkflowExecutor } from './WorkflowExecutor.js';
import { ReportGenerator } from './ReportGenerator.js';
import { ProgressReporter } from '../utils/ProgressReporter.js';
import { TestStateManager } from '../utils/TestStateManager.js';

/**
 * Test Orchestrator - Main coordinator for the testing system
 * Manages test execution flow and coordinates all components
 */
export class TestOrchestrator {
  constructor(config) {
    this.config = config;
    this.mcpClient = null;
    this.roleManager = null;
    this.errorCapture = null;
    this.pageNavigator = null;
    this.workflowExecutor = null;
    this.reportGenerator = null;
    this.progressReporter = null;
    this.stateManager = null;
    
    this.testResults = [];
    this.allErrors = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    console.log('Initializing Test Orchestrator...');
    
    try {
      // Initialize MCP client
      this.mcpClient = new MCPClient();
      await this.mcpClient.initialize();
      console.log('✓ MCP Client initialized');

      // Initialize error capture
      this.errorCapture = new ErrorCapture(this.mcpClient);
      await this.errorCapture.startMonitoring();
      console.log('✓ Error Capture initialized');

      // Initialize page navigator
      this.pageNavigator = new PageNavigator(this.mcpClient, this.errorCapture);
      console.log('✓ Page Navigator initialized');

      // Initialize workflow executor
      this.workflowExecutor = new WorkflowExecutor(
        this.mcpClient,
        this.errorCapture,
        this.pageNavigator
      );
      console.log('✓ Workflow Executor initialized');

      // Initialize role manager
      this.roleManager = new RoleManager(
        this.mcpClient,
        this.errorCapture,
        this.pageNavigator,
        this.workflowExecutor,
        this.config
      );
      console.log('✓ Role Manager initialized');

      // Initialize progress reporter
      this.progressReporter = new ProgressReporter();
      console.log('✓ Progress Reporter initialized');

      // Initialize state manager for test resumption
      this.stateManager = new TestStateManager(this.config.output.directory);
      console.log('✓ Test State Manager initialized');

      console.log('All components initialized successfully\n');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Test Orchestrator:', error.message);
      throw error;
    }
  }

  /**
   * Run tests for all roles
   */
  async runAllTests() {
    this.startTime = Date.now();
    console.log('='.repeat(60));
    console.log('Starting Comprehensive UI Role Testing');
    console.log('='.repeat(60));
    console.log();

    const roles = ['guest', 'user', 'admin'];
    
    for (const role of roles) {
      try {
        await this.runRoleTests(role);
        
        // Save state after each role
        await this.stateManager.saveState({
          completedRoles: this.testResults.map(r => r.role),
          testResults: this.testResults,
          errors: this.allErrors,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error(`\nFailed to complete tests for role: ${role}`);
        console.error(error.message);
        
        // Continue with next role
        this.testResults.push({
          role,
          status: 'failed',
          error: error.message,
          timestamp: Date.now()
        });
      }
    }

    this.endTime = Date.now();
    console.log();
    console.log('='.repeat(60));
    console.log('All Role Tests Completed');
    console.log('='.repeat(60));
    
    return this.testResults;
  }

  /**
   * Run tests for a specific role
   */
  async runRoleTests(role) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing Role: ${role.toUpperCase()}`);
    console.log('='.repeat(60));
    
    const roleStartTime = Date.now();
    const roleResult = {
      role,
      startTime: roleStartTime,
      pagesVisited: 0,
      workflowsExecuted: 0,
      errors: [],
      screenshots: [],
      status: 'running'
    };

    try {
      // Update progress
      this.progressReporter.startRole(role);

      // Authenticate as role (if not guest)
      if (role !== 'guest') {
        console.log(`\nAuthenticating as ${role}...`);
        await this.roleManager.authenticateAs(role);
        console.log(`✓ Authenticated as ${role}`);
      } else {
        console.log('\nTesting as guest (no authentication)');
      }

      // Get accessible pages for this role
      const pages = this.roleManager.getAccessiblePages(role);
      console.log(`\nPages to test: ${pages.length}`);
      
      // Test each page
      for (const page of pages) {
        try {
          this.progressReporter.updateProgress(role, page, null);
          console.log(`\n  Testing page: ${page}`);
          
          await this.pageNavigator.navigateTo(page);
          await this.pageNavigator.waitForPageLoad();
          
          // Verify page loaded correctly
          const snapshot = await this.pageNavigator.takeSnapshot();
          
          roleResult.pagesVisited++;
          console.log(`  ✓ Page loaded successfully`);
        } catch (error) {
          console.log(`  ✗ Page failed: ${error.message}`);
          roleResult.errors.push({
            page,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }

      // Test role permissions
      console.log(`\nTesting role permissions...`);
      await this.roleManager.testRolePermissions(role);
      console.log(`✓ Permission tests completed`);

      // Execute workflows for this role
      const workflows = this.roleManager.getWorkflowsForRole(role);
      console.log(`\nExecuting workflows: ${workflows.length}`);
      
      for (const workflowName of workflows) {
        try {
          this.progressReporter.updateProgress(role, null, workflowName);
          console.log(`\n  Executing workflow: ${workflowName}`);
          
          const workflowResult = await this.workflowExecutor.executeWorkflow(
            workflowName,
            { role }
          );
          
          roleResult.workflowsExecuted++;
          console.log(`  ✓ Workflow completed`);
        } catch (error) {
          console.log(`  ✗ Workflow failed: ${error.message}`);
          roleResult.errors.push({
            workflow: workflowName,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }

      // Logout if authenticated
      if (role !== 'guest') {
        console.log(`\nLogging out...`);
        await this.roleManager.logout();
        console.log(`✓ Logged out`);
      }

      // Collect errors from error capture
      const capturedErrors = this.errorCapture.getCategorizedErrors();
      roleResult.errors.push(...capturedErrors);
      this.allErrors.push(...capturedErrors);

      roleResult.endTime = Date.now();
      roleResult.duration = roleResult.endTime - roleStartTime;
      roleResult.status = 'completed';

      console.log(`\n✓ Role testing completed for: ${role}`);
      console.log(`  Pages visited: ${roleResult.pagesVisited}`);
      console.log(`  Workflows executed: ${roleResult.workflowsExecuted}`);
      console.log(`  Errors found: ${roleResult.errors.length}`);
      console.log(`  Duration: ${(roleResult.duration / 1000).toFixed(2)}s`);

    } catch (error) {
      roleResult.status = 'failed';
      roleResult.error = error.message;
      roleResult.endTime = Date.now();
      roleResult.duration = roleResult.endTime - roleStartTime;
      
      console.error(`\n✗ Role testing failed for: ${role}`);
      console.error(`  Error: ${error.message}`);
    }

    this.testResults.push(roleResult);
    this.progressReporter.completeRole(role);
    
    return roleResult;
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('Generating Test Reports');
    console.log('='.repeat(60));

    try {
      this.reportGenerator = new ReportGenerator(
        this.testResults,
        this.allErrors,
        this.config
      );

      const reports = {
        html: null,
        json: null,
        markdown: null
      };

      // Generate reports based on configuration
      if (this.config.output.formats.includes('html')) {
        console.log('\nGenerating HTML report...');
        reports.html = await this.reportGenerator.generateHTMLReport();
        console.log(`✓ HTML report saved to: ${reports.html}`);
      }

      if (this.config.output.formats.includes('json')) {
        console.log('\nGenerating JSON report...');
        reports.json = await this.reportGenerator.generateJSONReport();
        console.log(`✓ JSON report saved to: ${reports.json}`);
      }

      if (this.config.output.formats.includes('markdown')) {
        console.log('\nGenerating Markdown summary...');
        reports.markdown = await this.reportGenerator.generateMarkdownSummary();
        console.log(`✓ Markdown summary saved to: ${reports.markdown}`);
      }

      // Generate fix suggestions
      console.log('\nGenerating fix suggestions...');
      const fixes = await this.reportGenerator.suggestFixes(this.allErrors);
      console.log(`✓ Fix suggestions saved`);

      // Export screenshots
      console.log('\nExporting screenshots...');
      await this.reportGenerator.exportScreenshots();
      console.log(`✓ Screenshots exported`);

      console.log('\n✓ All reports generated successfully');
      
      return reports;
    } catch (error) {
      console.error('\n✗ Failed to generate reports:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('\nCleaning up resources...');
    
    try {
      if (this.errorCapture) {
        this.errorCapture.stopMonitoring();
      }
      
      // Clear test state
      await this.stateManager.clearState();
      
      console.log('✓ Cleanup completed');
    } catch (error) {
      console.error('Warning: Cleanup encountered errors:', error.message);
    }
  }

  /**
   * Get test summary statistics
   */
  getSummary() {
    const totalTests = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'completed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const totalErrors = this.allErrors.length;
    const duration = this.endTime - this.startTime;

    return {
      totalTests,
      passed,
      failed,
      totalErrors,
      duration,
      durationFormatted: `${(duration / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString()
    };
  }
}
