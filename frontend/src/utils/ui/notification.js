class NotificationService {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "notification-container";
      this.container.className =
        "fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md";
      document.body.appendChild(this.container);
    }
  }

  show(message, type = "info", duration = 3000) {
    const notification = this.createNotification(message, type);
    this.container.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("opacity-0", "translate-x-full");
    }, duration);

    setTimeout(() => {
      notification.remove();
    }, duration + 300);

    return notification;
  }

  createNotification(message, type) {
    const colors = {
      success: "bg-green-600",
      error: "bg-red-600",
      warning: "bg-yellow-600",
      info: "bg-blue-600",
    };

    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };

    const notification = document.createElement("div");
    notification.className = `${
      colors[type] || colors.info
    } text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform flex items-center gap-3 min-w-[300px]`;

    notification.innerHTML = `
      <i class="fas fa-${icons[type] || icons.info}"></i>
      <span class="flex-1">${message}</span>
      <button class="text-white hover:text-gray-200 transition-colors">
        <i class="fas fa-times"></i>
      </button>
    `;

    notification.querySelector("button").addEventListener("click", () => {
      notification.classList.add("opacity-0", "translate-x-full");
      setTimeout(() => notification.remove(), 300);
    });

    return notification;
  }

  success(message, duration) {
    return this.show(message, "success", duration);
  }

  error(message, duration) {
    return this.show(message, "error", duration);
  }

  warning(message, duration) {
    return this.show(message, "warning", duration);
  }

  info(message, duration) {
    return this.show(message, "info", duration);
  }

  confirm(message, title = "Confirm") {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            <i class="fas fa-question-circle text-yellow-500 mr-2"></i>${title}
          </h3>
          <p class="text-gray-600 mb-6">${message}</p>
          <div class="flex justify-end gap-3">
            <button id="cancelBtn" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button id="confirmBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Confirm
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const confirmBtn = modal.querySelector("#confirmBtn");
      const cancelBtn = modal.querySelector("#cancelBtn");

      confirmBtn.addEventListener("click", () => {
        modal.remove();
        resolve(true);
      });

      cancelBtn.addEventListener("click", () => {
        modal.remove();
        resolve(false);
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      });
    });
  }

  prompt(message, defaultValue = "", title = "Input") {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            <i class="fas fa-edit text-blue-500 mr-2"></i>${title}
          </h3>
          <p class="text-gray-600 mb-4">${message}</p>
          <input 
            type="text" 
            id="promptInput" 
            value="${defaultValue}"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-6"
            autofocus
          />
          <div class="flex justify-end gap-3">
            <button id="cancelBtn" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button id="submitBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Submit
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const input = modal.querySelector("#promptInput");
      const submitBtn = modal.querySelector("#submitBtn");
      const cancelBtn = modal.querySelector("#cancelBtn");

      input.focus();
      input.select();

      const submit = () => {
        const value = input.value.trim();
        modal.remove();
        resolve(value || null);
      };

      submitBtn.addEventListener("click", submit);
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") submit();
      });

      cancelBtn.addEventListener("click", () => {
        modal.remove();
        resolve(null);
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(null);
        }
      });
    });
  }

  alert(message, title = "Notice", type = "info") {
    return new Promise((resolve) => {
      const colors = {
        success: "text-green-500",
        error: "text-red-500",
        warning: "text-yellow-500",
        info: "text-blue-500",
      };

      const icons = {
        success: "check-circle",
        error: "exclamation-circle",
        warning: "exclamation-triangle",
        info: "info-circle",
      };

      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            <i class="fas fa-${icons[type] || icons.info} ${
        colors[type] || colors.info
      } mr-2"></i>${title}
          </h3>
          <p class="text-gray-600 mb-6">${message}</p>
          <div class="flex justify-end">
            <button id="okBtn" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              OK
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const okBtn = modal.querySelector("#okBtn");

      okBtn.addEventListener("click", () => {
        modal.remove();
        resolve();
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve();
        }
      });
    });
  }
}

export const notify = new NotificationService();
