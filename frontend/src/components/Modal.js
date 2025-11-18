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
    <div id="${id}" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4" data-modal-overlay="${id}">
      <div class="bg-white rounded-lg ${sizeClass} w-full max-h-[90vh] overflow-y-auto" data-modal-content="${id}">
        <div class="bg-indigo-600 p-6 text-white border-b-4 border-indigo-700">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-bold">${title}</h2>
              ${subtitle
      ? `<p class="text-indigo-100 mt-1">${subtitle}</p>`
      : ""
    }
            </div>
            <button class="modal-close text-white hover:text-indigo-200 transition-colors" data-modal="${id}" aria-label="Close modal">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>
        <div class="modal-body p-6">${body}</div>
        ${footer
      ? `<div class="modal-footer p-6 border-t border-gray-200 flex justify-end space-x-3">${footer}</div>`
      : ""
    }
      </div>
    </div>
  `;
}

export function openModal(modalId, options = {}) {
  const { onOpen } = options;
  const $modal = $(`#${modalId}`);

  if (!$modal.length) {
    console.warn(`Modal with ID "${modalId}" not found`);
    return;
  }

  $modal.trigger('modal:beforeOpen.modal', { modalId });

  $modal.removeClass("hidden").fadeIn(200, function () {
    $(this).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first().trigger('focus');
    $modal.trigger('modal:opened.modal', { modalId });

    if (onOpen && typeof onOpen === 'function') {
      onOpen($modal);
    }
  });
}

export function closeModal(modalId, options = {}) {
  const { onClose } = options;
  const $modal = $(`#${modalId}`);

  if (!$modal.length) {
    console.warn(`Modal with ID "${modalId}" not found`);
    return;
  }

  $modal.trigger('modal:beforeClose.modal', { modalId });

  $modal.fadeOut(200, function () {
    $(this).addClass("hidden");
    $modal.trigger('modal:closed.modal', { modalId });

    if (onClose && typeof onClose === 'function') {
      onClose($modal);
    }
  });
}

export function initModalCloseHandlers() {
  $(document).off('.modal');

  $(document).on("click.modal", ".modal-close", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const modalId = $(this).data("modal") || $(this).closest("[id$='Modal']").attr("id");

    if (modalId) {
      closeModal(modalId);
    }
  });

  $(document).on("click.modal", "[data-modal-overlay]", function (e) {
    if ($(e.target).is(this)) {
      const modalId = $(this).attr("id");
      if (modalId) {
        closeModal(modalId);
      }
    }
  });

  $(document).on("keydown.modal", function (e) {
    if (e.key === "Escape") {
      const $visibleModal = $("[id$='Modal']:visible").last();

      if ($visibleModal.length) {
        const modalId = $visibleModal.attr("id");
        closeModal(modalId);
      }
    }
  });
}

export function cleanupModalHandlers() {
  $(document).off('.modal');
}

export function isModalOpen(modalId) {
  const $modal = $(`#${modalId}`);
  return $modal.length && $modal.is(':visible');
}

export function toggleModal(modalId, options = {}) {
  if (isModalOpen(modalId)) {
    closeModal(modalId, options);
  } else {
    openModal(modalId, options);
  }
}
