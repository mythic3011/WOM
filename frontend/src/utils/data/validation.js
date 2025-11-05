export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

export function validateUsername(username) {
  return username && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

export function validatePhone(phone) {
  const re = /^[+]?[\d\s-()]+$/;
  return phone && re.test(phone) && phone.replace(/\D/g, "").length >= 8;
}

export function validateRequired(value) {
  return (
    value !== null && value !== undefined && value.toString().trim() !== ""
  );
}

export function validateMinLength(value, minLength) {
  return value && value.length >= minLength;
}

export function validateMaxLength(value, maxLength) {
  return value && value.length <= maxLength;
}

export function validateRange(value, min, max) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

export function getPasswordStrength(password) {
  if (!password) return { strength: 0, label: "None", color: "gray" };

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 2)
    return { strength: 1, label: "Weak", color: "red", percent: 25 };
  if (strength <= 4)
    return { strength: 2, label: "Fair", color: "yellow", percent: 50 };
  if (strength <= 5)
    return { strength: 3, label: "Good", color: "blue", percent: 75 };
  return { strength: 4, label: "Strong", color: "green", percent: 100 };
}

export function showValidationError(fieldId, message) {
  const field = $(`#${fieldId}`);
  field.addClass("border-red-500");

  const errorId = `${fieldId}-error`;
  $(`#${errorId}`).remove();

  field.after(
    `<p id="${errorId}" class="text-red-500 text-sm mt-1">${message}</p>`
  );
}

export function clearValidationError(fieldId) {
  const field = $(`#${fieldId}`);
  field.removeClass("border-red-500");
  $(`#${fieldId}-error`).remove();
}

export function validateForm(formData, rules) {
  const errors = {};

  Object.entries(rules).forEach(([field, validators]) => {
    const value = formData[field];

    validators.forEach((validator) => {
      if (validator.required && !validateRequired(value)) {
        errors[field] = validator.message || `${field} is required`;
      } else if (validator.email && value && !validateEmail(value)) {
        errors[field] = validator.message || "Invalid email format";
      } else if (
        validator.minLength &&
        !validateMinLength(value, validator.minLength)
      ) {
        errors[field] =
          validator.message ||
          `${field} must be at least ${validator.minLength} characters`;
      } else if (
        validator.maxLength &&
        !validateMaxLength(value, validator.maxLength)
      ) {
        errors[field] =
          validator.message ||
          `${field} must be no more than ${validator.maxLength} characters`;
      } else if (validator.pattern && !validator.pattern.test(value)) {
        errors[field] = validator.message || `Invalid ${field} format`;
      } else if (validator.custom && !validator.custom(value, formData)) {
        errors[field] = validator.message || `Invalid ${field}`;
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
