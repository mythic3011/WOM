export function createPageLayout({
    title,
    subtitle,
    icon,
    actions = [],
    children = "",
    maxWidth = "7xl",
    noPadding = false,
}) {
    const maxWidthClasses = {
        sm: "max-w-2xl",
        md: "max-w-4xl",
        lg: "max-w-5xl",
        xl: "max-w-6xl",
        "7xl": "max-w-7xl",
        full: "max-w-full",
    };

    const maxWidthClass = maxWidthClasses[maxWidth] || maxWidthClasses["7xl"];
    const paddingClass = noPadding ? "" : "px-4 py-8";

    return `
    <main class="min-h-screen bg-gray-50">
      <div class="container mx-auto ${paddingClass}">
        <div class="${maxWidthClass} mx-auto">
          ${title ? createPageHeader({ title, subtitle, icon, actions }) : ""}
          ${children}
        </div>
      </div>
    </main>
  `;
}

export function createPageHeader({ title, subtitle, icon, actions = [] }) {
    return `
    <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          ${icon ? `<i class="fas ${icon} text-indigo-600 mr-3"></i>` : ""
        }${title}
        </h1>
        ${subtitle ? `<p class="text-gray-600 mt-2">${subtitle}</p>` : ""}
      </div>
      ${actions.length > 0
            ? `
        <div class="flex gap-2">
          ${actions.join("")}
        </div>
      `
            : ""
        }
    </div>
  `;
}

export function createPageSection({
    title,
    subtitle,
    icon,
    children = "",
    noBorder = false,
    className = "",
}) {
    return `
    <div class="bg-white rounded-lg shadow-md ${!noBorder ? "border border-gray-200" : ""
        } p-6 ${className}">
      ${title
            ? `
        <div class="mb-4 ${subtitle ? "pb-4 border-b border-gray-200" : ""}">
          <h2 class="text-xl font-bold text-gray-900 flex items-center">
            ${icon ? `<i class="fas ${icon} text-indigo-600 mr-2"></i>` : ""
            }${title}
          </h2>
          ${subtitle
                ? `<p class="text-sm text-gray-600 mt-1">${subtitle}</p>`
                : ""
            }
        </div>
      `
            : ""
        }
      ${children}
    </div>
  `;
}

export function createGridLayout({
    columns = 3,
    gap = 6,
    children = "",
    responsive = true,
}) {
    const colClasses = {
        1: "grid-cols-1",
        2: responsive ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2",
        3: responsive ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-3",
        4: responsive ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-4",
    };

    const colClass = colClasses[columns] || colClasses[3];
    const gapClass = `gap-${gap}`;

    return `
    <div class="grid ${colClass} ${gapClass}">
      ${children}
    </div>
  `;
}

export function createTwoColumnLayout({
    leftColumn = "",
    rightColumn = "",
    leftSpan = 2,
    rightSpan = 1,
    gap = 6,
    sticky = false,
}) {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-${gap}">
      <div class="lg:col-span-${leftSpan}">
        ${leftColumn}
      </div>
      <div class="lg:col-span-${rightSpan}">
        ${sticky
            ? `<div class="sticky top-6">${rightColumn}</div>`
            : rightColumn
        }
      </div>
    </div>
  `;
}

export function createDashboardLayout({
    header = "",
    stats = "",
    mainContent = "",
    sidebar = "",
}) {
    return `
    ${header}

    ${stats ? `<div class="mb-8">${stats}</div>` : ""}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        ${mainContent}
      </div>
      ${sidebar
            ? `
        <div class="lg:col-span-1">
          ${sidebar}
        </div>
      `
            : ""
        }
    </div>
  `;
}

export function createContentCard({
    title,
    icon,
    badge,
    children = "",
    actions = [],
    noPadding = false,
}) {
    return `
    <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      ${title
            ? `
        <div class="border-b border-gray-200 p-6 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              ${icon
                ? `<i class="fas ${icon} text-indigo-600 text-xl"></i>`
                : ""
            }
              <h3 class="text-lg font-bold text-gray-900">${title}</h3>
              ${badge || ""}
            </div>
            ${actions.length > 0
                ? `
              <div class="flex gap-2">
                ${actions.join("")}
              </div>
            `
                : ""
            }
          </div>
        </div>
      `
            : ""
        }
      <div class="${noPadding ? "" : "p-6"}">
        ${children}
      </div>
    </div>
  `;
}
