/**
 * @file validationService.js
 * @description Service for validating user input and form data
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 */

/**
 * @description Validation service for form and data validation
 */
export const validationService = {
  /**
   * @description Validates email format
   * @param {string} email - Email address
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    if (!email) {return false;}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * @description Validates phone number format
   * @param {string} phone - Phone number
   * @returns {boolean} True if valid
   */
  validatePhone(phone) {
    if (!phone) {return true;}
    const cleanPhone = phone.replace(/\s+/g, "");
    const phoneRegex = /^[2-9][0-9]{7}$/;
    return phoneRegex.test(cleanPhone);
  },

  /**
   * @description Validates password strength
   * @param {string} password - Password
   * @returns {Object} Validation result with valid flag and errors array
   */
  validatePassword(password) {
    if (!password) {return { valid: false, errors: ["Password is required"] };}

    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * @description Validates user age is at least 13
   * @param {string} birthdate - Birth date
   * @returns {boolean} True if age is valid
   */
  validateAge(birthdate) {
    if (!birthdate) {return false;}
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1 >= 13;
    }
    return age >= 13;
  },

  /**
   * @description Validates booking data
   * @param {Object} data - Booking data
   * @returns {Object} Validation result with valid flag and errors array
   */
  validateBookingData(data) {
    const errors = [];

    if (!data.performanceId) {
      errors.push("Performance is required");
    }

    if (!data.showtimeId) {
      errors.push("Showtime is required");
    }

    if (!data.selectedSeats || data.selectedSeats.length === 0) {
      errors.push("At least one seat must be selected");
    }

    if (data.selectedSeats && data.selectedSeats.length > 10) {
      errors.push("Maximum 10 seats per booking");
    }

    if (!data.contactInfo?.name) {
      errors.push("Contact name is required");
    }

    if (
      !data.contactInfo?.email ||
      !this.validateEmail(data.contactInfo.email)
    ) {
      errors.push("Valid email is required");
    }

    if (
      data.contactInfo?.phone &&
      !this.validatePhone(data.contactInfo.phone)
    ) {
      errors.push("Invalid phone number format");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * @description Validates venue data
   * @param {Object} data - Venue data
   * @returns {Object} Validation result with valid flag and errors array
   */
  validateVenueData(data) {
    const errors = [];

    if (!data.name || !data.name.trim()) {
      errors.push("Venue name is required");
    }

    if (data.name && data.name.length > 255) {
      errors.push("Venue name must not exceed 255 characters");
    }

    if (
      data.capacity &&
      (data.capacity < 0 || !Number.isInteger(data.capacity))
    ) {
      errors.push("Capacity must be a non-negative integer");
    }

    if (data.layout?.sections) {
      data.layout.sections.forEach((section, index) => {
        if (!section.name) {
          errors.push(`Section ${index + 1}: Name is required`);
        }
        if (!section.rows || section.rows < 1) {
          errors.push(`Section ${index + 1}: Invalid number of rows`);
        }
        if (!section.seatsPerRow || section.seatsPerRow < 1) {
          errors.push(`Section ${index + 1}: Invalid seats per row`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * @description Validates performance data
   * @param {Object} data - Performance data
   * @returns {Object} Validation result with valid flag and errors array
   */
  validatePerformanceData(data) {
    const errors = [];

    if (!data.title || !data.title.trim()) {
      errors.push("Performance title is required");
    }

    if (!data.composer || !data.composer.trim()) {
      errors.push("Composer is required");
    }

    if (!data.date) {
      errors.push("Performance date is required");
    }

    if (data.date && new Date(data.date) < new Date()) {
      errors.push("Performance date must be in the future");
    }

    if (!data.venueId) {
      errors.push("Venue is required");
    }

    if (!data.duration || data.duration < 1) {
      errors.push("Valid duration is required");
    }

    if (data.pricing) {
      if (!data.pricing.basePrice || data.pricing.basePrice < 0) {
        errors.push("Valid base price is required");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * @description Validates user data
   * @param {Object} data - User data
   * @returns {Object} Validation result with valid flag and errors array
   */
  validateUserData(data) {
    const errors = [];

    if (!data.username || data.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }

    if (data.username && !/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push(
        "Username can only contain letters, numbers, hyphens, and underscores"
      );
    }

    if (!data.email || !this.validateEmail(data.email)) {
      errors.push("Valid email is required");
    }

    if (!data.name || !data.name.trim()) {
      errors.push("Name is required");
    }

    if (data.password) {
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (data.phone && !this.validatePhone(data.phone)) {
      errors.push("Invalid phone number format");
    }

    if (data.birthday && !this.validateAge(data.birthday)) {
      errors.push("User must be at least 13 years old");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * @description Gets validation errors based on rules
   * @param {Object} data - Data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result with valid flag and errors array
   */
  getValidationErrors(data, rules) {
    const errors = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];

      if (
        fieldRules.required &&
        (!value || (typeof value === "string" && !value.trim()))
      ) {
        errors.push(`${fieldRules.label || field} is required`);
        continue;
      }

      if (
        value &&
        fieldRules.minLength &&
        value.length < fieldRules.minLength
      ) {
        errors.push(
          `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`
        );
      }

      if (
        value &&
        fieldRules.maxLength &&
        value.length > fieldRules.maxLength
      ) {
        errors.push(
          `${fieldRules.label || field} must not exceed ${fieldRules.maxLength} characters`
        );
      }

      if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors.push(
          fieldRules.message || `${fieldRules.label || field} format is invalid`
        );
      }

      if (value && fieldRules.min !== undefined && value < fieldRules.min) {
        errors.push(
          `${fieldRules.label || field} must be at least ${fieldRules.min}`
        );
      }

      if (value && fieldRules.max !== undefined && value > fieldRules.max) {
        errors.push(
          `${fieldRules.label || field} must not exceed ${fieldRules.max}`
        );
      }

      if (value && fieldRules.custom) {
        const customResult = fieldRules.custom(value, data);
        if (customResult !== true) {
          errors.push(
            customResult || `${fieldRules.label || field} is invalid`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
