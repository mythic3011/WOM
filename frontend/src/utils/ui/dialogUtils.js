import Swal from "sweetalert2";

export const dialogUtils = {
  async confirmDelete(itemName, itemType = "item") {
    return await Swal.fire({
      title: `Delete ${itemType}?`,
      html: `
        <p class="text-gray-700">Are you sure you want to delete <strong>${itemName}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
  },

  async confirmAction(title, message, confirmText = "Confirm") {
    return await Swal.fire({
      title,
      html: message,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: confirmText,
      cancelButtonText: "Cancel",
    });
  },

  async promptText(title, placeholder = "", defaultValue = "") {
    return await Swal.fire({
      title,
      input: "text",
      inputValue: defaultValue,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "This field is required";
        }
      },
    });
  },

  async promptTextarea(title, placeholder = "", defaultValue = "") {
    return await Swal.fire({
      title,
      input: "textarea",
      inputValue: defaultValue,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "This field is required";
        }
      },
    });
  },

  async promptNumber(title, options = {}) {
    const {
      min,
      max,
      placeholder = "Enter a number",
      defaultValue = "",
    } = options;

    return await Swal.fire({
      title,
      input: "number",
      inputValue: defaultValue,
      inputPlaceholder: placeholder,
      inputAttributes: {
        min: min !== undefined ? min : "",
        max: max !== undefined ? max : "",
        step: options.step || "1",
      },
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "This field is required";
        }
        const num = parseFloat(value);
        if (isNaN(num)) {
          return "Please enter a valid number";
        }
        if (min !== undefined && num < min) {
          return `Value must be at least ${min}`;
        }
        if (max !== undefined && num > max) {
          return `Value must be at most ${max}`;
        }
      },
    });
  },

  async promptSelect(title, options, defaultValue = "") {
    const inputOptions = {};
    options.forEach((opt) => {
      inputOptions[opt.value] = opt.label;
    });

    return await Swal.fire({
      title,
      input: "select",
      inputOptions,
      inputValue: defaultValue,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "Please make a selection";
        }
      },
    });
  },

  async showInfo(title, message, icon = "info") {
    return await Swal.fire({
      title,
      html: message,
      icon,
      confirmButtonText: "OK",
      confirmButtonColor: "#4f46e5",
    });
  },

  async showSuccess(title, message) {
    return await Swal.fire({
      title,
      html: message,
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#10b981",
      timer: 3000,
      timerProgressBar: true,
    });
  },

  async showError(title, message) {
    return await Swal.fire({
      title,
      html: message,
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#ef4444",
    });
  },

  async showWarning(title, message) {
    return await Swal.fire({
      title,
      html: message,
      icon: "warning",
      confirmButtonText: "OK",
      confirmButtonColor: "#f59e0b",
    });
  },

  async showLoading(title = "Processing...", message = "Please wait") {
    Swal.fire({
      title,
      html: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  closeLoading() {
    Swal.close();
  },

  async showProgress(title, steps, currentStep) {
    const percentage = Math.round((currentStep / steps.length) * 100);

    return await Swal.fire({
      title,
      html: `
        <div class="space-y-3">
          <p class="text-gray-700">${
            steps[currentStep - 1] || "Processing..."
          }</p>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${percentage}%"></div>
          </div>
          <p class="text-sm text-gray-500">Step ${currentStep} of ${
        steps.length
      }</p>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
    });
  },

  async showImagePreview(imageUrl, title = "Image Preview") {
    return await Swal.fire({
      title,
      imageUrl,
      imageAlt: title,
      showCloseButton: true,
      showConfirmButton: false,
      width: "800px",
    });
  },

  async showCustomForm(title, formFields, options = {}) {
    const { width = "600px", confirmText = "Submit" } = options;

    const formHTML = formFields
      .map((field) => {
        const {
          id,
          label,
          type = "text",
          placeholder = "",
          required = false,
          options: selectOptions = [],
          value = "",
        } = field;

        let inputHTML = "";

        switch (type) {
          case "textarea":
            inputHTML = `<textarea id="${id}" class="swal2-textarea w-full" placeholder="${placeholder}" ${
              required ? "required" : ""
            }>${value}</textarea>`;
            break;
          case "select":
            inputHTML = `
              <select id="${id}" class="swal2-select w-full" ${
              required ? "required" : ""
            }>
                <option value="">-- Select --</option>
                ${selectOptions
                  .map(
                    (opt) =>
                      `<option value="${opt.value}" ${
                        opt.value === value ? "selected" : ""
                      }>${opt.label}</option>`
                  )
                  .join("")}
              </select>
            `;
            break;
          case "number":
            inputHTML = `<input type="number" id="${id}" class="swal2-input w-full" placeholder="${placeholder}" value="${value}" ${
              required ? "required" : ""
            }>`;
            break;
          case "date":
            inputHTML = `<input type="date" id="${id}" class="swal2-input w-full" value="${value}" ${
              required ? "required" : ""
            }>`;
            break;
          case "datetime-local":
            inputHTML = `<input type="datetime-local" id="${id}" class="swal2-input w-full" value="${value}" ${
              required ? "required" : ""
            }>`;
            break;
          case "checkbox":
            inputHTML = `
              <label class="flex items-center gap-2">
                <input type="checkbox" id="${id}" ${value ? "checked" : ""}>
                <span>${label}</span>
              </label>
            `;
            break;
          default:
            inputHTML = `<input type="${type}" id="${id}" class="swal2-input w-full" placeholder="${placeholder}" value="${value}" ${
              required ? "required" : ""
            }>`;
        }

        return `
          <div class="mb-4 text-left">
            ${
              type !== "checkbox"
                ? `<label class="block text-sm font-medium text-gray-700 mb-2">${label}${
                    required ? " *" : ""
                  }</label>`
                : ""
            }
            ${inputHTML}
          </div>
        `;
      })
      .join("");

    return await Swal.fire({
      title,
      html: `<div class="space-y-4">${formHTML}</div>`,
      width,
      showCancelButton: true,
      confirmButtonText: confirmText,
      preConfirm: () => {
        const formData = {};
        formFields.forEach((field) => {
          const element = document.getElementById(field.id);
          if (element) {
            if (field.type === "checkbox") {
              formData[field.id] = element.checked;
            } else {
              formData[field.id] = element.value;
            }

            if (field.required && !formData[field.id]) {
              Swal.showValidationMessage(`${field.label} is required`);
              return false;
            }
          }
        });
        return formData;
      },
    });
  },

  async showConfirmWithInput(title, message, inputLabel, inputType = "text") {
    return await Swal.fire({
      title,
      html: `
        <p class="text-gray-700 mb-4">${message}</p>
        <input type="${inputType}" id="confirmInput" class="swal2-input w-full" placeholder="${inputLabel}">
      `,
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      preConfirm: () => {
        const value = document.getElementById("confirmInput").value;
        if (!value) {
          Swal.showValidationMessage(`${inputLabel} is required`);
          return false;
        }
        return value;
      },
    });
  },

  async showList(title, items, options = {}) {
    const { selectable = false, multiSelect = false } = options;

    const listHTML = items
      .map(
        (item, index) => `
        <div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded ${
          selectable ? "cursor-pointer" : ""
        }" data-index="${index}">
          ${
            selectable
              ? `<input type="${
                  multiSelect ? "checkbox" : "radio"
                }" name="listItem" value="${index}">`
              : ""
          }
          <div class="flex-1">
            <div class="font-medium">${item.title || item.name || item}</div>
            ${
              item.description
                ? `<div class="text-sm text-gray-500">${item.description}</div>`
                : ""
            }
          </div>
        </div>
      `
      )
      .join("");

    return await Swal.fire({
      title,
      html: `<div class="max-h-96 overflow-y-auto text-left">${listHTML}</div>`,
      width: "600px",
      showCancelButton: selectable,
      showConfirmButton: selectable,
      preConfirm: () => {
        if (!selectable) return null;

        if (multiSelect) {
          const selected = [];
          document
            .querySelectorAll('input[name="listItem"]:checked')
            .forEach((input) => {
              selected.push(parseInt(input.value));
            });
          return selected;
        } else {
          const selected = document.querySelector(
            'input[name="listItem"]:checked'
          );
          return selected ? parseInt(selected.value) : null;
        }
      },
    });
  },
};
