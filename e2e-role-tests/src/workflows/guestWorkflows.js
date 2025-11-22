/**
 * Guest Workflows
 * Workflow definitions for guest (unauthenticated) role testing
 */

export const guestWorkflows = {
  viewPublicPages: {
    name: 'View Public Pages',
    description: 'Test accessing public pages without authentication',
    steps: [
      {
        action: 'navigate',
        target: '/'
      },
      {
        action: 'wait',
        duration: 2000
      },
      {
        action: 'verify',
        condition: 'home page'
      },
      {
        action: 'navigate',
        target: '/performances'
      },
      {
        action: 'wait',
        text: 'performances',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'performance list'
      },
      {
        action: 'navigate',
        target: '/login'
      },
      {
        action: 'wait',
        text: 'login',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'login form'
      }
    ]
  },

  attemptRestrictedAccess: {
    name: 'Attempt Restricted Access',
    description: 'Test that restricted pages redirect to login',
    steps: [
      {
        action: 'navigate',
        target: '/admin/dashboard'
      },
      {
        action: 'wait',
        duration: 2000
      },
      {
        action: 'verify',
        condition: 'login'
      },
      {
        action: 'navigate',
        target: '/user/dashboard'
      },
      {
        action: 'wait',
        duration: 2000
      },
      {
        action: 'verify',
        condition: 'login'
      },
      {
        action: 'navigate',
        target: '/user/bookings'
      },
      {
        action: 'wait',
        duration: 2000
      },
      {
        action: 'verify',
        condition: 'login'
      }
    ]
  },

  testLoginRedirect: {
    name: 'Test Login Redirect',
    description: 'Test that login redirects work correctly',
    steps: [
      {
        action: 'navigate',
        target: '/login'
      },
      {
        action: 'wait',
        text: 'login',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'login form'
      },
      {
        action: 'click',
        selector: 'register'
      },
      {
        action: 'wait',
        text: 'register',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'registration form'
      }
    ]
  }
};
