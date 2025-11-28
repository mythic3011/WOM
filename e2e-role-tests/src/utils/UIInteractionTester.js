/**
 * UI Interaction Tester
 * Tests UI interactions like buttons, dropdowns, modals, tables
 */
export class UIInteractionTester {
  constructor(mcpClient, errorCapture) {
    this.mcpClient = mcpClient;
    this.errorCapture = errorCapture;
  }

  /**
   * Test button clicks and navigation
   */
  async testButtonClick(buttonUid) {
    try {
      const beforeSnapshot = await this.mcpClient.takeSnapshot();
      await this.mcpClient.click(buttonUid);
      await this.sleep(1000);
      const afterSnapshot = await this.mcpClient.takeSnapshot();

      return {
        success: true,
        changed: beforeSnapshot !== afterSnapshot
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test dropdown selections
   */
  async testDropdownSelection(dropdownUid, value) {
    try {
      await this.mcpClient.fill(dropdownUid, value);
      await this.sleep(500);

      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      return {
        success: true,
        valueSet: snapshotText.includes(value)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test modal open/close
   */
  async testModal(openButtonUid, closeButtonUid) {
    const results = {
      opened: false,
      closed: false,
      error: null
    };

    try {
      // Open modal
      await this.mcpClient.click(openButtonUid);
      await this.sleep(1000);

      let snapshot = await this.mcpClient.takeSnapshot();
      let snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      results.opened = snapshotText.includes('modal') || snapshotText.includes('dialog');

      // Close modal
      if (closeButtonUid) {
        await this.mcpClient.click(closeButtonUid);
        await this.sleep(1000);

        snapshot = await this.mcpClient.takeSnapshot();
        snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

        results.closed = !snapshotText.includes('modal') || !snapshotText.includes('dialog');
      }
    } catch (error) {
      results.error = error.message;
    }

    return results;
  }

  /**
   * Test data table sorting
   */
  async testTableSorting(sortButtonUid) {
    try {
      const beforeSnapshot = await this.mcpClient.takeSnapshot();
      
      await this.mcpClient.click(sortButtonUid);
      await this.sleep(1000);

      const afterSnapshot = await this.mcpClient.takeSnapshot();

      return {
        success: true,
        changed: beforeSnapshot !== afterSnapshot
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test data table filtering
   */
  async testTableFiltering(filterInputUid, filterValue) {
    try {
      await this.mcpClient.fill(filterInputUid, filterValue);
      await this.sleep(1000);

      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      return {
        success: true,
        filtered: snapshotText.includes(filterValue)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test data table pagination
   */
  async testTablePagination(nextButtonUid) {
    try {
      const beforeSnapshot = await this.mcpClient.takeSnapshot();
      
      await this.mcpClient.click(nextButtonUid);
      await this.sleep(1000);

      const afterSnapshot = await this.mcpClient.takeSnapshot();

      return {
        success: true,
        changed: beforeSnapshot !== afterSnapshot
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
