export const formUtils = {
  getValues: (fields) => {
    return fields.reduce((acc, field) => {
      const $el = $(`#${field}`);
      if ($el.length === 0) return acc;
      
      if ($el.is(":checkbox")) {
        acc[field] = $el.is(":checked");
      } else if ($el.is(":radio")) {
        acc[field] = $(`input[name="${field}"]:checked`).val();
      } else {
        acc[field] = $el.val()?.trim() || "";
      }
      return acc;
    }, {});
  },

  setValues: (data) => {
    Object.keys(data).forEach(key => {
      const $el = $(`#${key}`);
      if ($el.length === 0) return;
      
      if ($el.is(":checkbox")) {
        $el.prop("checked", !!data[key]);
      } else if ($el.is(":radio")) {
        $(`input[name="${key}"][value="${data[key]}"]`).prop("checked", true);
      } else {
        $el.val(data[key]);
      }
    });
  },

  reset: ($form, callback) => {
    if (typeof $form === "string") {
      $form = $($form);
    }
    $form.trigger("reset");
    if (callback) callback();
  },

  validateRequired: (fields, messages = {}) => {
    const errors = [];
    
    fields.forEach(field => {
      const $el = $(`#${field}`);
      const value = $el.val()?.trim();
      
      if (!value || value === "") {
        errors.push({
          field,
          message: messages[field] || `${field} is required`
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  clearErrors: (formSelector) => {
    $(formSelector).find(".error-message").remove();
    $(formSelector).find(".border-red-500").removeClass("border-red-500");
  },

  showFieldError: (fieldId, message) => {
    const $field = $(`#${fieldId}`);
    $field.addClass("border-red-500");
    
    if ($field.next(".error-message").length === 0) {
      $field.after(`<p class="error-message text-red-500 text-xs mt-1">${message}</p>`);
    }
  }
};

export const getFormValues = formUtils.getValues;
export const setFormValues = formUtils.setValues;
export const resetForm = formUtils.reset;
export const validateRequired = formUtils.validateRequired;
export const clearErrors = formUtils.clearErrors;
export const showFieldError = formUtils.showFieldError;


