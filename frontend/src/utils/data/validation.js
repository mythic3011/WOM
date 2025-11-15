import { validationService } from "../../services/validationService.js";

export function validateEmail(email) {
  return validationService.validateEmail(email);
}

export function validatePassword(password) {
  const result = validationService.validatePassword(password);
  return result.valid;
}

export function validateUsername(username) {
  return username && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

export function validatePhone(phone) {
  return validationService.validatePhone(phone);
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
  const convertedRules = {};

  Object.entries(rules).forEach(([field, validators]) => {
    convertedRules[field] = {
      label: field,
      required: validators.some((v) => v.required),
      pattern: validators.find((v) => v.pattern)?.pattern,
      minLength: validators.find((v) => v.minLength)?.minLength,
      maxLength: validators.find((v) => v.maxLength)?.maxLength,
      custom: validators.find((v) => v.custom)?.custom,
      message: validators[0]?.message,
    };
  });

  const result = validationService.getValidationErrors(
    formData,
    convertedRules
  );

  const errors = {};
  result.errors.forEach((error) => {
    const field = Object.keys(convertedRules).find((f) => error.includes(f));
    if (field) errors[field] = error;
  });

  return {
    isValid: result.valid,
    errors,
  };
}
