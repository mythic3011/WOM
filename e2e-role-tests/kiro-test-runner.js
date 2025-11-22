/**
 * Kiro-Native Test Runner
 * This file is meant to be executed by Kiro directly, not as a Node.js script
 * 
 * Usage: Ask Kiro to "Execute the test runner" or "Run UI role tests"
 */

// Import test components
import { TestOrchestrator } from './src/core/TestOrchestrator.js';
import { ConfigLoader } from './src/utils/ConfigLoader.js';

/**
 * Main test execution function
 * This will be called by Kiro when you ask it to run tests
 */
export async function runUIRoleTests(options = {}) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     UI Role Testing System with MCP Chrome DevTools       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  try {
    // Load configuration
    console.log('Loading configuration...');
    const configLoader = new ConfigLoader(options.config || './e2e-role-tests/test-config.json');
    const config = await configLoader.load();
    console.log('✓ Configuration loaded\n');

    // Initialize Test Orchestrator
    const orchestrator = new TestOrchestrator(config);
    await orchestrator.initialize();

    // Run tests
    let results;
    if (options.role) {
      console.log(`Running tests for role: ${options.role}\n`);
      results = await orchestrator.runRoleTests(options.role);
    } else {
      console.log('Running tests for all roles\n');
      results = await orchestrator.runAllTests();
    }

    // Generate reports
    console.log();
    const reports = await orchestrator.generateReport();

    // Cleanup
    await orchestrator.cleanup();

    // Print summary
    console.log();
    const summary = orchestrator.getSummary();
    printSummary(summary, reports);

    return {
      success: summary.failed === 0 && summary.totalErrors === 0,
      summary,
      reports
    };

  } catch (error) {
    console.error('\n❌ Test execution failed:');
    console.error(error.message);
    console.error();
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Print test summary
 */
function printSummary(summary, reports) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      Test Summary                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`  Total Tests:    ${summary.totalTests}`);
  console.log(`  Passed:         ${summary.passed} ✓`);
  console.log(`  Failed:         ${summary.failed} ${summary.failed > 0 ? '✗' : ''}`);
  console.log(`  Errors Found:   ${summary.totalErrors} ${summary.totalErrors > 0 ? '⚠' : ''}`);
  console.log(`  Duration:       ${summary.durationFormatted}`);
  console.log();

  if (reports) {
    console.log('Reports Generated:');
    if (reports.html) {
      console.log(`  📄 HTML:     ${reports.html}`);
    }
    if (reports.json) {
      console.log(`  📊 JSON:     ${reports.json}`);
    }
    if (reports.markdown) {
      console.log(`  📝 Markdown: ${reports.markdown}`);
    }
    console.log();
  }

  if (summary.failed === 0 && summary.totalErrors === 0) {
    console.log('  🎉 All tests passed! No errors found.');
  } else {
    console.log('  ⚠️  Some tests failed or errors were found. Check reports for details.');
  }
  console.log();
}

// Export for use by Kiro
export default runUIRoleTests;
