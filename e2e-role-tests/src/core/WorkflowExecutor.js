import { WORKFLOWS } from '../workflows/index.js';

/**
 * Workflow Executor - Executes user workflows and interactions
 */
export class WorkflowExecutor {
  constructor(mcpClient, errorCapture, pageNavigator) {
    this.mcpClient = mcpClient;
    this.errorCapture = errorCapture;
    this.pageNavigator = pageNavigator;
    this.workflows = WORKFLOWS;
  }

  /**
   * Execute a workflow by name
   */
  async executeWorkflow(workflowName, context = {}) {
    const workflow = this.workflows[workflowName];
    
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    const workflowContext = {
      role: context.role || 'unknown',
      workflowName,
      currentStep: 0,
      totalSteps: workflow.steps.length,
      data: {},
      startTime: Date.now(),
      errors: []
    };

    console.log(`    Starting workflow: ${workflowName} (${workflow.steps.length} steps)`);

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        workflowContext.currentStep = i + 1;

        console.log(`      Step ${i + 1}/${workflow.steps.length}: ${step.action}`);

        try {
          await this.executeStep(step, workflowContext);
        } catch (error) {
          console.log(`      ✗ Step failed: ${error.message}`);
          
          workflowContext.errors.push({
            step: i + 1,
            action: step.action,
            error: error.message
          });

          // Capture error with context
          await this.errorCapture.captureError({
            type: 'workflow',
            severity: 'high',
            message: `Workflow step failed: ${workflowName} - ${step.action}`,
            page: this.pageNavigator.getCurrentURL(),
            role: workflowContext.role,
            context: {
              workflow: workflowName,
              step: i + 1,
              action: step.action,
              error: error.message
            },
            reproductionSteps: this.generateReproductionSteps(workflow, i)
          });

          // Continue with next step unless it's critical
          if (step.critical !== false) {
            throw error;
          }
        }
      }

      workflowContext.endTime = Date.now();
      workflowContext.duration = workflowContext.endTime - workflowContext.startTime;
      workflowContext.status = 'completed';

      return workflowContext;
    } catch (error) {
      workflowContext.endTime = Date.now();
      workflowContext.duration = workflowContext.endTime - workflowContext.startTime;
      workflowContext.status = 'failed';
      workflowContext.error = error.message;

      throw new Error(`Workflow failed: ${workflowName} - ${error.message}`);
    }
  }

  /**
   * Execute a single workflow step
   */
  async executeStep(step, context) {
    switch (step.action) {
      case 'navigate':
        await this.pageNavigator.navigateTo(step.target);
        await this.pageNavigator.waitForPageLoad();
        break;

      case 'click':
        await this.clickElement(step.selector);
        break;

      case 'fill':
        if (step.form) {
          await this.fillForm(step.data);
        } else {
          await this.mcpClient.fill(step.selector, step.value);
        }
        break;

      case 'wait':
        if (step.text) {
          await this.pageNavigator.waitForText(step.text, step.timeout);
        } else if (step.selector) {
          await this.waitForElement(step.selector, step.timeout);
        } else {
          await this.sleep(step.duration || 1000);
        }
        break;

      case 'verify':
        await this.verifyPageState(step.condition);
        break;

      case 'select':
        await this.selectOption(step.selector, step.value);
        break;

      case 'hover':
        await this.mcpClient.hover(step.selector);
        break;

      case 'pressKey':
        await this.mcpClient.pressKey(step.key);
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    // Wait a bit after each step
    await this.sleep(500);
  }

  /**
   * Fill a form with data
   */
  async fillForm(formData) {
    try {
      // Get current snapshot to find form fields
      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      const elements = [];

      // Map form data to UIDs from snapshot
      for (const [fieldName, value] of Object.entries(formData)) {
        // Try to find field in snapshot
        const fieldRegex = new RegExp(`uid="([^"]+)"[^>]*${fieldName}`, 'i');
        const match = snapshotText.match(fieldRegex);

        if (match) {
          elements.push({
            uid: match[1],
            value: String(value)
          });
        }
      }

      if (elements.length > 0) {
        await this.mcpClient.fillForm(elements);
      }

      return { success: true, fieldsFilled: elements.length };
    } catch (error) {
      throw new Error(`Failed to fill form: ${error.message}`);
    }
  }

  /**
   * Click an element
   */
  async clickElement(selector) {
    try {
      // Get snapshot to find element UID
      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      // Try to find element by selector
      const uidRegex = new RegExp(`uid="([^"]+)"[^>]*${selector}`, 'i');
      const match = snapshotText.match(uidRegex);

      if (!match) {
        throw new Error(`Element not found: ${selector}`);
      }

      await this.mcpClient.click(match[1]);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to click element ${selector}: ${error.message}`);
    }
  }

  /**
   * Wait for an element
   */
  async waitForElement(selector, timeout = 10000) {
    return await this.pageNavigator.waitForElement(selector, timeout);
  }

  /**
   * Verify page state
   */
  async verifyPageState(expectedState) {
    try {
      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      // Simple verification - check if expected text/state is in snapshot
      const stateText = expectedState.toLowerCase();
      const found = snapshotText.toLowerCase().includes(stateText);

      if (!found) {
        throw new Error(`Expected state not found: ${expectedState}`);
      }

      return { success: true, state: expectedState };
    } catch (error) {
      throw new Error(`Page state verification failed: ${error.message}`);
    }
  }

  /**
   * Select an option from dropdown
   */
  async selectOption(selector, value) {
    try {
      // Get snapshot to find select element
      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      const uidRegex = new RegExp(`uid="([^"]+)"[^>]*${selector}`, 'i');
      const match = snapshotText.match(uidRegex);

      if (!match) {
        throw new Error(`Select element not found: ${selector}`);
      }

      await this.mcpClient.fill(match[1], value);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to select option: ${error.message}`);
    }
  }

  /**
   * Generate reproduction steps for error reporting
   */
  generateReproductionSteps(workflow, failedStepIndex) {
    const steps = [];
    
    for (let i = 0; i <= failedStepIndex && i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      steps.push(`${i + 1}. ${step.action} ${step.target || step.selector || ''}`);
    }

    return steps;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available workflows
   */
  getAvailableWorkflows() {
    return Object.keys(this.workflows);
  }

  /**
   * Get workflow definition
   */
  getWorkflow(workflowName) {
    return this.workflows[workflowName] || null;
  }
}
