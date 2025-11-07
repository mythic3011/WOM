export const formValidator = {
  validateRequired(value, fieldName) {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  },

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { valid: false, error: "Email is required" };
    }
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Invalid email format" };
    }
    return { valid: true };
  },

  validatePassword(password) {
    if (!password) {
      return { valid: false, error: "Password is required" };
    }
    if (password.length < 8) {
      return {
        valid: false,
        error: "Password must be at least 8 characters long",
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one uppercase letter",
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one lowercase letter",
      };
    }
    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one number",
      };
    }
    return { valid: true };
  },

  validateUsername(username) {
    if (!username) {
      return { valid: false, error: "Username is required" };
    }
    if (username.length < 3) {
      return {
        valid: false,
        error: "Username must be at least 3 characters long",
      };
    }
    if (username.length > 20) {
      return {
        valid: false,
        error: "Username must be at most 20 characters long",
      };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        valid: false,
        error: "Username can only contain letters, numbers, and underscores",
      };
    }
    return { valid: true };
  },

  validateNumber(value, fieldName, options = {}) {
    const { min, max, integer = false } = options;

    if (value === "" || value === null || value === undefined) {
      return { valid: false, error: `${fieldName} is required` };
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, error: `${fieldName} must be a valid number` };
    }

    if (integer && !Number.isInteger(num)) {
      return { valid: false, error: `${fieldName} must be a whole number` };
    }

    if (min !== undefined && num < min) {
      return { valid: false, error: `${fieldName} must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
      return { valid: false, error: `${fieldName} must be at most ${max}` };
    }

    return { valid: true, value: num };
  },

  validateDate(dateString, fieldName) {
    if (!dateString) {
      return { valid: false, error: `${fieldName} is required` };
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { valid: false, error: `${fieldName} is not a valid date` };
    }

    return { valid: true, value: date };
  },

  validateDateRange(startDate, endDate) {
    const start = this.validateDate(startDate, "Start date");
    if (!start.valid) return start;

    const end = this.validateDate(endDate, "End date");
    if (!end.valid) return end;

    if (start.value > end.value) {
      return { valid: false, error: "Start date must be before end date" };
    }

    return { valid: true };
  },

  validateFutureDate(dateString, fieldName) {
    const result = this.validateDate(dateString, fieldName);
    if (!result.valid) return result;

    if (result.value < new Date()) {
      return { valid: false, error: `${fieldName} must be in the future` };
    }

    return { valid: true, value: result.value };
  },

  validateUrl(url, fieldName = "URL") {
    if (!url) {
      return { valid: false, error: `${fieldName} is required` };
    }

    try {
      new URL(url);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: `${fieldName} is not a valid URL` };
    }
  },

  validateFileSize(file, maxSizeMB = 5) {
    if (!file) {
      return { valid: false, error: "File is required" };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  },

  validateFileType(file, allowedTypes = []) {
    if (!file) {
      return { valid: false, error: "File is required" };
    }

    if (allowedTypes.length === 0) return { valid: true };

    const fileType = file.type;
    const isAllowed = allowedTypes.some((type) => {
      if (type.includes("*")) {
        const baseType = type.split("/")[0];
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  },

  validateImage(file) {
    const typeCheck = this.validateFileType(file, [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ]);
    if (!typeCheck.valid) return typeCheck;

    return this.validateFileSize(file, 5);
  },

  validateForm(formData, rules) {
    const errors = {};
    let isValid = true;

    Object.entries(rules).forEach(([field, validators]) => {
      const value = formData[field];

      for (const validator of validators) {
        const result = validator(value);
        if (!result.valid) {
          errors[field] = result.error;
          isValid = false;
          break;
        }
      }
    });

    return { isValid, errors };
  },

  validateArrayNotEmpty(array, fieldName) {
    if (!Array.isArray(array) || array.length === 0) {
      return {
        valid: false,
        error: `At least one ${fieldName} is required`,
      };
    }
    return { valid: true };
  },

  validatePhoneNumber(phone) {
    if (!phone) {
      return { valid: false, error: "Phone number is required" };
    }

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");

    if (!/^\+?[0-9]{8,15}$/.test(cleanedPhone)) {
      return {
        valid: false,
        error: "Invalid phone number format",
      };
    }

    return { valid: true };
  },

  validatePercentage(value, fieldName) {
    const result = this.validateNumber(value, fieldName, { min: 0, max: 100 });
    if (!result.valid) return result;

    return { valid: true, value: result.value };
  },

  sanitizeInput(input) {
    if (typeof input !== "string") return input;

    return input.trim().replace(/[<>]/g, "").substring(0, 1000);
  },

  sanitizeHtml(html) {
    if (typeof html !== "string") return html;

    const $div = $("<div>").text(html);
    return $div.html();
  },
};
