
export const LoadingStates = {
    renderSkeleton(type = "table") {
        switch (type) {
            case "table":
                return this.renderTableSkeleton();
            case "card":
                return this.renderCardSkeleton();
            case "form":
                return this.renderFormSkeleton();
            default:
                return this.renderSpinner();
        }
    },

    renderTableSkeleton(rows = 5) {
        return `
      <div class="animate-pulse">
        <div class="bg-gray-50 rounded-t-lg p-4 border-b border-gray-200">
          <div class="grid grid-cols-7 gap-4">
            ${Array(7)
                .fill(0)
                .map(() => '<div class="h-4 bg-gray-300 rounded"></div>')
                .join("")}
          </div>
        </div>
        ${Array(rows)
                .fill(0)
                .map(
                    () => `
            <div class="p-4 border-b border-gray-200">
              <div class="grid grid-cols-7 gap-4">
                <div class="h-16 w-16 bg-gray-200 rounded"></div>
                <div class="space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          `
                )
                .join("")}
      </div>
    `;
    },

    renderCardSkeleton(count = 3) {
        return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        ${Array(count)
                .fill(0)
                .map(
                    () => `
            <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div class="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div class="space-y-3">
                <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                <div class="flex gap-2 mt-4">
                  <div class="h-10 bg-gray-200 rounded flex-1"></div>
                  <div class="h-10 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          `
                )
                .join("")}
      </div>
    `;
    },

    renderFormSkeleton() {
        return `
      <div class="space-y-6 animate-pulse">
        ${Array(4)
                .fill(0)
                .map(
                    () => `
            <div>
              <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div class="h-12 bg-gray-200 rounded"></div>
            </div>
          `
                )
                .join("")}
        <div class="flex gap-3">
          <div class="h-12 bg-gray-200 rounded flex-1"></div>
          <div class="h-12 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    `;
    },

    renderSpinner(size = "md", color = "indigo") {
        const sizeClasses = {
            sm: "w-6 h-6",
            md: "w-12 h-12",
            lg: "w-16 h-16",
            xl: "w-24 h-24",
        };

        const colorClasses = {
            indigo: "border-indigo-600",
            green: "border-green-600",
            blue: "border-blue-600",
            red: "border-red-600",
        };

        return `
      <div class="flex justify-center items-center py-12">
        <div class="${sizeClasses[size]} border-4 ${colorClasses[color]} border-t-transparent rounded-full animate-spin"></div>
      </div>
    `;
    },

    renderInlineSpinner(text = "Loading...") {
        return `
      <div class="inline-flex items-center gap-2 text-gray-600">
        <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm">${text}</span>
      </div>
    `;
    },

    renderProgressBar(progress, label = "") {
        return `
      <div class="w-full">
        ${label ? `<div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-700">${label}</span>
          <span class="text-sm font-semibold text-indigo-600">${progress}%</span>
        </div>` : ""}
        <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
    },

    renderUploadProgress(fileName, progress) {
        return `
      <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <i class="fas fa-file text-gray-400"></i>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">${fileName}</div>
            <div class="text-xs text-gray-500">${progress}% complete</div>
          </div>
          ${progress === 100
                ? '<i class="fas fa-check-circle text-green-500"></i>'
                : '<i class="fas fa-circle-notch fa-spin text-indigo-600"></i>'
            }
        </div>
        ${this.renderProgressBar(progress)}
      </div>
    `;
    },
};

