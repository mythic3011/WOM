/**
 * Admin Workflows
 * Workflow definitions for admin role testing
 */

export const adminWorkflows = {
  // COMPREHENSIVE ADMIN PERFORMANCE PAGE TEST
  testAdminPerformancePageFull: {
    name: 'Admin Performance Page - Complete Test',
    description: 'Comprehensive test of ALL buttons and flows on admin performance page',
    steps: [
      // Navigate to page
      {
        action: 'navigate',
        target: '/admin/performances',
        description: 'Navigate to admin performances page'
      },
      {
        action: 'wait',
        text: 'Performance Management',
        timeout: 5000
      },
      {
        action: 'snapshot',
        description: 'Page loaded'
      },

      // Test all filter buttons
      {
        action: 'fill',
        uid: 'searchInput',
        value: 'Symphony',
        description: 'Test search filter'
      },
      {
        action: 'wait',
        duration: 500
      },
      {
        action: 'click',
        uid: 'clearFilters',
        description: 'Test clear filters button'
      },
      {
        action: 'wait',
        duration: 300
      },

      // Test Quick Create button
      {
        action: 'click',
        uid: 'quickCreateBtn',
        description: 'Click Quick Create button'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'snapshot',
        description: 'Quick Create wizard opened'
      },

      // Fill wizard Step 1
      {
        action: 'fill',
        uid: 'wizardTitle',
        value: 'E2E Test - Mahler Symphony No. 5',
        description: 'Fill title'
      },
      {
        action: 'fill',
        uid: 'wizardComposer',
        value: 'Gustav Mahler',
        description: 'Fill composer'
      },
      {
        action: 'fill',
        uid: 'wizardConductor',
        value: 'Gustavo Dudamel',
        description: 'Fill conductor'
      },
      {
        action: 'fill',
        uid: 'wizardDescription',
        value: 'A comprehensive E2E test performance featuring Mahler Symphony No. 5 with full orchestra and testing all functionality.',
        description: 'Fill description'
      },
      {
        action: 'fill',
        uid: 'wizardDuration',
        value: '90',
        description: 'Fill duration'
      },
      {
        action: 'snapshot',
        description: 'Step 1 filled'
      },

      // Click Next to Step 2
      {
        action: 'click',
        uid: 'wizardNextBtn',
        description: 'Click Next to Step 2'
      },
      {
        action: 'wait',
        duration: 500
      },
      {
        action: 'snapshot',
        description: 'Step 2 loaded'
      },

      // Test Previous button
      {
        action: 'click',
        uid: 'wizardPrevBtn',
        description: 'Test Previous button'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Go back to Step 2
      {
        action: 'click',
        uid: 'wizardNextBtn',
        description: 'Return to Step 2'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Close wizard to test Add Performance button
      {
        action: 'press_key',
        key: 'Escape',
        description: 'Close wizard'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Test Add Performance button (Advanced Form)
      {
        action: 'click',
        uid: 'addPerformanceBtn',
        description: 'Click Add Performance button'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'snapshot',
        description: 'Advanced form opened'
      },

      // Close modal
      {
        action: 'press_key',
        key: 'Escape',
        description: 'Close advanced form'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Test action dropdown buttons
      {
        action: 'click',
        selector: '.action-dropdown-btn',
        description: 'Open action dropdown'
      },
      {
        action: 'wait',
        duration: 300
      },
      {
        action: 'snapshot',
        description: 'Action dropdown opened'
      },

      // Test View Details button
      {
        action: 'click',
        selector: '.action-view-btn',
        description: 'Click View Details'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'snapshot',
        description: 'View details modal'
      },
      {
        action: 'press_key',
        key: 'Escape',
        description: 'Close view details'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Test Quick Edit button
      {
        action: 'click',
        selector: '.action-dropdown-btn',
        description: 'Open action dropdown again'
      },
      {
        action: 'wait',
        duration: 300
      },
      {
        action: 'click',
        selector: '.action-edit-btn',
        description: 'Click Quick Edit'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'snapshot',
        description: 'Quick Edit wizard opened'
      },
      {
        action: 'press_key',
        key: 'Escape',
        description: 'Close Quick Edit'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Test Advanced Edit button
      {
        action: 'click',
        selector: '.action-dropdown-btn',
        description: 'Open action dropdown'
      },
      {
        action: 'wait',
        duration: 300
      },
      {
        action: 'click',
        selector: '.action-advanced-edit-btn',
        description: 'Click Advanced Edit'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'snapshot',
        description: 'Advanced Edit form opened'
      },
      {
        action: 'press_key',
        key: 'Escape',
        description: 'Close Advanced Edit'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Test Duplicate button
      {
        action: 'click',
        selector: '.action-dropdown-btn',
        description: 'Open action dropdown'
      },
      {
        action: 'wait',
        duration: 300
      },
      {
        action: 'click',
        selector: '.action-duplicate-btn',
        description: 'Click Duplicate'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'snapshot',
        description: 'Duplicate dialog opened'
      },
      {
        action: 'press_key',
        key: 'Escape',
        description: 'Close Duplicate dialog'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Test Delete button (but cancel)
      {
        action: 'click',
        selector: '.action-dropdown-btn',
        description: 'Open action dropdown'
      },
      {
        action: 'wait',
        duration: 300
      },
      {
        action: 'click',
        selector: '.action-delete-btn',
        description: 'Click Delete'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'snapshot',
        description: 'Delete confirmation dialog'
      },
      {
        action: 'press_key',
        key: 'Escape',
        description: 'Cancel deletion'
      },
      {
        action: 'wait',
        duration: 500
      },

      // Final snapshot
      {
        action: 'snapshot',
        description: 'All buttons tested successfully'
      }
    ]
  },

  createPerformance: {
    name: 'Create Performance',
    description: 'Test creating a new performance',
    steps: [
      {
        action: 'navigate',
        target: '/admin/performances'
      },
      {
        action: 'wait',
        text: 'performances',
        timeout: 5000
      },
      {
        action: 'click',
        selector: 'add'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'fill',
        form: true,
        data: {
          title: 'Test Performance',
          description: 'Automated test performance',
          venue: '1',
          date: '2024-12-25',
          time: '19:00'
        }
      },
      {
        action: 'click',
        selector: 'submit'
      },
      {
        action: 'wait',
        text: 'success',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'performance created'
      }
    ]
  },

  manageUsers: {
    name: 'Manage Users',
    description: 'Test user management functionality',
    steps: [
      {
        action: 'navigate',
        target: '/admin/users'
      },
      {
        action: 'wait',
        text: 'users',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'user list'
      },
      {
        action: 'click',
        selector: 'filter'
      },
      {
        action: 'wait',
        duration: 500
      },
      {
        action: 'fill',
        selector: 'search',
        value: 'test'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'verify',
        condition: 'filtered results'
      }
    ]
  },

  viewBookings: {
    name: 'View Bookings',
    description: 'Test viewing all bookings',
    steps: [
      {
        action: 'navigate',
        target: '/admin/bookings'
      },
      {
        action: 'wait',
        text: 'bookings',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'booking list'
      },
      {
        action: 'click',
        selector: 'sort'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'verify',
        condition: 'sorted bookings'
      }
    ]
  },

  manageVenues: {
    name: 'Manage Venues',
    description: 'Test venue management functionality',
    steps: [
      {
        action: 'navigate',
        target: '/admin/venues'
      },
      {
        action: 'wait',
        text: 'venues',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'venue list'
      },
      {
        action: 'click',
        selector: 'add'
      },
      {
        action: 'wait',
        duration: 1000
      },
      {
        action: 'fill',
        form: true,
        data: {
          name: 'Test Venue',
          capacity: '100',
          address: '123 Test St'
        }
      },
      {
        action: 'click',
        selector: 'submit'
      },
      {
        action: 'wait',
        text: 'success',
        timeout: 5000
      }
    ]
  }
};
