export function createModal({
  id,
  title,
  subtitle = "",
  body = "",
  footer = "",
  size = "md",
}) {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full mx-4",
  };

  const sizeClass = sizes[size] || sizes.md;

  return `
    <div id="${id}" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-lg ${sizeClass} w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-indigo-600 p-6 text-white border-b-4 border-indigo-700">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-bold">${title}</h2>
              ${
                subtitle
                  ? `<p class="text-indigo-100 mt-1">${subtitle}</p>`
                  : ""
              }
            </div>
            <button class="modal-close text-white hover:text-indigo-200 transition-colors" data-modal="${id}">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>
        <div class="modal-body p-6">${body}</div>
        ${
          footer
            ? `<div class="modal-footer p-6 border-t border-gray-200 flex justify-end space-x-3">${footer}</div>`
            : ""
        }
      </div>
    </div>
  `;
}

export function openModal(modalId) {
  $(`#${modalId}`).removeClass("hidden").fadeIn(200);
}

export function closeModal(modalId) {
  $(`#${modalId}`).fadeOut(200, function () {
    $(this).addClass("hidden");
  });
}

export function initModalCloseHandlers() {
  $(document).on("click", ".modal-close", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const modalId =
      $(this).data("modal") || $(this).closest("[data-modal]").data("modal");
    if (modalId) {
      closeModal(modalId);
    }
  });

  $(document).on("click", "[id$='Modal']", function (e) {
    if ($(e.target).is(this)) {
      closeModal($(this).attr("id"));
    }
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      const visibleModal = $("[id$='Modal']:visible").last();
      if (visibleModal.length) {
        closeModal(visibleModal.attr("id"));
      }
    }
  });
}
