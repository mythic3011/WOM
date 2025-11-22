/**
 * User Workflows
 * Workflow definitions for regular user role testing
 */

export const userWorkflows = {
  createBooking: {
    name: 'Create Booking',
    description: 'Test complete booking flow with seat selection',
    steps: [
      {
        action: 'navigate',
        target: '/booking?performance=1'
      },
      {
        action: 'wait',
        text: 'seat',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'seat map'
      },
      {
        action: 'click',
        selector: 'available'
      },
      {
        action: 'wait',
        duration: 500
      },
      {
        action: 'click',
        selector: 'continue'
      },
      {
        action: 'wait',
        text: 'ticket',
        timeout: 5000
      },
      {
        action: 'click',
        selector: 'assign'
      },
      {
        action: 'wait',
        duration: 500
      },
      {
        action: 'click',
        selector: 'review'
      },
      {
        action: 'wait',
        text: 'payment',
        timeout: 5000
      },
      {
        action: 'fill',
        form: true,
        data: {
          cardNumber: '4111111111111111',
          cardName: 'Test User',
          expiryDate: '12/25',
          cvv: '123'
        }
      },
      {
        action: 'click',
        selector: 'confirm'
      },
      {
        action: 'wait',
        text: 'confirmation',
        timeout: 10000
      },
      {
        action: 'verify',
        condition: 'booking confirmed'
      }
    ]
  },

  viewProfile: {
    name: 'View Profile',
    description: 'Test viewing user profile',
    steps: [
      {
        action: 'navigate',
        target: '/user/profile'
      },
      {
        action: 'wait',
        text: 'profile',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'user information'
      }
    ]
  },

  downloadTicket: {
    name: 'Download Ticket',
    description: 'Test downloading a ticket',
    steps: [
      {
        action: 'navigate',
        target: '/user/bookings'
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
        selector: 'download'
      },
      {
        action: 'wait',
        duration: 2000
      },
      {
        action: 'verify',
        condition: 'ticket downloaded'
      }
    ]
  },

  updateProfile: {
    name: 'Update Profile',
    description: 'Test updating user profile information',
    steps: [
      {
        action: 'navigate',
        target: '/user/profile'
      },
      {
        action: 'wait',
        text: 'profile',
        timeout: 5000
      },
      {
        action: 'click',
        selector: 'edit'
      },
      {
        action: 'wait',
        duration: 500
      },
      {
        action: 'fill',
        form: true,
        data: {
          firstName: 'Updated',
          lastName: 'User',
          email: 'updated@test.com',
          phone: '1234567890'
        }
      },
      {
        action: 'click',
        selector: 'save'
      },
      {
        action: 'wait',
        text: 'success',
        timeout: 5000
      },
      {
        action: 'verify',
        condition: 'profile updated'
      }
    ]
  }
};
