import fs from 'fs/promises';
import path from 'path';

/**
 * Test State Manager - Manages test state for resumption
 */
export class TestStateManager {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.stateFile = path.join(outputDir, '.test-state.json');
  }

  /**
   * Save test state
   */
  async saveState(state) {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.warn('Could not save test state:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load test state
   */
  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear test state
   */
  async clearState() {
    try {
      await fs.unlink(this.stateFile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if interrupted test exists
   */
  async hasInterruptedTest() {
    try {
      await fs.access(this.stateFile);
      return true;
    } catch (error) {
      return false;
    }
  }
}
