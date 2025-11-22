/**
 * Form Validation Tester
 * Tests form field validation
 */
export class FormValidationTester {
  constructor(mcpClient, errorCapture) {
    this.mcpClient = mcpClient;
    this.errorCapture = errorCapture;
  }

  /**
   * Test required field validation
   */
  async testRequiredFields(formSelector) {
    const results = {
      tested: 0,
      passed: 0,
      failed: 0,
      details: []
    };

    try {
      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      // Find required fields
      const requiredMatches = snapshotText.matchAll(/uid="([^"]+)"[^>]*required/gi);
      
      for (const match of requiredMatches) {
        results.tested++;
        const uid = match[1];

        try {
          // Try to submit without filling
          await this.mcpClient.fill(uid, '');
          
          // Check for validation error
          await this.sleep(500);
          const errorSnapshot = await this.mcpClient.takeSnapshot();
          const errorText = typeof errorSnapshot === 'string' ? errorSnapshot : JSON.stringify(errorSnapshot);

          if (errorText.includes('required') || errorText.includes('error')) {
            results.passed++;
            results.details.push({ field: uid, status: 'passed' });
          } else {
            results.failed++;
            results.details.push({ field: uid, status: 'failed', message: 'No validation error shown' });
          }
        } catch (error) {
          results.failed++;
          results.details.push({ field: uid, status: 'error', message: error.message });
        }
      }
    } catch (error) {
      console.warn('Form validation test error:', error.message);
    }

    return results;
  }

  /**
   * Test email format validation
   */
  async testEmailValidation(emailFieldUid) {
    const invalidEmails = ['invalid', 'test@', '@test.com', 'test@test'];
    const validEmail = 'test@example.com';

    const results = {
      invalidRejected: 0,
      validAccepted: false
    };

    for (const email of invalidEmails) {
      try {
        await this.mcpClient.fill(emailFieldUid, email);
        await this.sleep(500);

        const snapshot = await this.mcpClient.takeSnapshot();
        const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

        if (snapshotText.includes('invalid') || snapshotText.includes('error')) {
          results.invalidRejected++;
        }
      } catch (error) {
        console.warn('Email validation test error:', error.message);
      }
    }

    // Test valid email
    try {
      await this.mcpClient.fill(emailFieldUid, validEmail);
      await this.sleep(500);

      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      results.validAccepted = !snapshotText.includes('invalid');
    } catch (error) {
      console.warn('Valid email test error:', error.message);
    }

    return results;
  }

  /**
   * Test phone number validation
   */
  async testPhoneValidation(phoneFieldUid) {
    const invalidPhones = ['abc', '123', '12345678901234567890'];
    const validPhone = '1234567890';

    const results = {
      invalidRejected: 0,
      validAccepted: false
    };

    for (const phone of invalidPhones) {
      try {
        await this.mcpClient.fill(phoneFieldUid, phone);
        await this.sleep(500);

        const snapshot = await this.mcpClient.takeSnapshot();
        const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

        if (snapshotText.includes('invalid') || snapshotText.includes('error')) {
          results.invalidRejected++;
        }
      } catch (error) {
        console.warn('Phone validation test error:', error.message);
      }
    }

    // Test valid phone
    try {
      await this.mcpClient.fill(phoneFieldUid, validPhone);
      await this.sleep(500);

      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      results.validAccepted = !snapshotText.includes('invalid');
    } catch (error) {
      console.warn('Valid phone test error:', error.message);
    }

    return results;
  }

  /**
   * Test date validation
   */
  async testDateValidation(dateFieldUid) {
    const invalidDates = ['invalid', '13/32/2024', '2024-13-32'];
    const validDate = '2024-12-25';

    const results = {
      invalidRejected: 0,
      validAccepted: false
    };

    for (const date of invalidDates) {
      try {
        await this.mcpClient.fill(dateFieldUid, date);
        await this.sleep(500);

        const snapshot = await this.mcpClient.takeSnapshot();
        const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

        if (snapshotText.includes('invalid') || snapshotText.includes('error')) {
          results.invalidRejected++;
        }
      } catch (error) {
        console.warn('Date validation test error:', error.message);
      }
    }

    // Test valid date
    try {
      await this.mcpClient.fill(dateFieldUid, validDate);
      await this.sleep(500);

      const snapshot = await this.mcpClient.takeSnapshot();
      const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

      results.validAccepted = !snapshotText.includes('invalid');
    } catch (error) {
      console.warn('Valid date test error:', error.message);
    }

    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
