#!/usr/bin/env node

import { TestOrchestrator } from './src/core/TestOrchestrator.js';
import { ConfigLoader } from './src/utils/ConfigLoader.js';

/**
 * Main Test Runner
 * Entry point for the UI role testing system
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     UI Role Testing System with MCP Chrome DevTools       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  try {
    // Parse command-line arguments
    const args = parseArguments();

    // Load configuration
    console.log('Loading configuration...');
    const configLoader = new ConfigLoader(args.config || './test-config.json');
    const config = await configLoader.load();
    console.log('✓ Configuration loaded\n');

    // Initialize Test Orchestrator
    const orchestrator = new TestOrchestrator(config);
    await orchestrator.initialize();

    // Run tests
    let results;
    if (args.role) {
      console.log(`Running tests for role: ${args.role}\n`);
      results = await orchestrator.runRoleTests(args.role);
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
    printSummary(orchestrator.getSummary(), reports);

    // Exit with appropriate code
    const summary = orchestrator.getSummary();
    const exitCode = summary.failed > 0 || summary.totalErrors > 0 ? 1 : 0;
    
    process.exit(exitCode);

  } catch (error) {
    console.error('\n❌ Test execution failed:');
    console.error(error.message);
    console.error();
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

/**
 * Parse command-line arguments
 */
function parseArguments() {
  const args = {
    role: null,
    config: null
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg.startsWith('--role=')) {
      args.role = arg.split('=')[1];
    } else if (arg.startsWith('--config=')) {
      args.config = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
UI Role Testing System

Usage:
  node run-tests.js [options]

Options:
  --role=<role>       Run tests for specific role (admin, user, guest)
  --config=<path>     Path to configuration file (default: ./test-config.json)
  --help, -h          Show this help message

Examples:
  node run-tests.js                    # Run all tests
  node run-tests.js --role=admin       # Test admin role only
  node run-tests.js --role=user        # Test user role only
  node run-tests.js --role=guest       # Test guest role only

Environment Variables:
  BASE_URL            Override base URL
  ADMIN_USERNAME      Override admin username
  ADMIN_PASSWORD      Override admin password
  USER_USERNAME       Override user username
  USER_PASSWORD       Override user password
  OUTPUT_DIR          Override output directory
`);
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

// Run main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
