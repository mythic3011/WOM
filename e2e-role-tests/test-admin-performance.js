/**
 * Test Admin Performance Page - All Buttons and Flows
 * Run this through Kiro, not as a standalone script
 * 
 * Usage: Ask Kiro to "Run the admin performance test"
 */

import { TestOrchestrator } from './src/core/TestOrchestrator.js';
import { ConfigLoader } from './src/utils/ConfigLoader.js';

export async function testAdminPerformancePage() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Admin Performance Page - Complete Button & Flow Test    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  try {
    // Load configuration
    console.log('Loading configuration...');
    const configLoader = new ConfigLoader('./test-config.json');
    const config = await configLoader.load();
    console.log('✓ Configuration loaded\n');

    // Initialize Test Orchestrator
    const orchestrator = new TestOrchestrator(config);
    await orchestrator.initialize();

    // Run only admin performance test
    console.log('Running Admin Performance Page test...\n');
    
    // Navigate to admin performances page
    await orchestrator.pageNavigator.navigateTo('/admin/performances');
    await orchestrator.pageNavigator.waitForPageLoad();
    console.log('✓ Navigated to admin performances page\n');

    // Execute the comprehensive workflow
    const workflowResult = await orchestrator.workflowExecutor.executeWorkflow(
      'testAdminPerformancePageFull',
      { role: 'admin' }
    );

    console.log('\n✓ Admin Performance Page test completed\n');

    // Generate report
    const reports = await orchestrator.generateReport();

    // Cleanup
    await orchestrator.cleanup();

    // Print summary
    console.log();
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                      Test Summary                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`  Workflow:       testAdminPerformancePageFull`);
    console.log(`  Status:         ${workflowResult.success ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  Steps:          ${workflowResult.stepsCompleted || 0}`);
    console.log(`  Errors:         ${workflowResult.errors?.length || 0}`);
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

    if (workflowResult.success) {
      console.log('  🎉 All buttons and flows tested successfully!');
    } else {
      console.log('  ⚠️  Some tests failed. Check reports for details.');
    }
    console.log();

    return {
      success: workflowResult.success,
      result: workflowResult,
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

export default testAdminPerformancePage;
