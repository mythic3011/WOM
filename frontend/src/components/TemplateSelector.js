import { templateService } from "@services/templateService.js";

export async function createTemplateSelector(onSelect) {
  const templates = await templateService.getAll();

  return `
    <div class="template-selector">
      <div class="mb-4">
        <input 
          type="text" 
          id="templateSearch" 
          placeholder="Search templates..." 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      <div class="flex gap-2 mb-4 flex-wrap">
        <button class="template-tag-btn px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-indigo-500 hover:text-white transition-colors" data-tag="">
          All
        </button>
        <button class="template-tag-btn px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-indigo-500 hover:text-white transition-colors" data-tag="Theater">
          Theater
        </button>
        <button class="template-tag-btn px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-indigo-500 hover:text-white transition-colors" data-tag="Concert">
          Concert
        </button>
        <button class="template-tag-btn px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-indigo-500 hover:text-white transition-colors" data-tag="Arena">
          Arena
        </button>
        <button class="template-tag-btn px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-indigo-500 hover:text-white transition-colors" data-tag="Small">
          Small
        </button>
        <button class="template-tag-btn px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-indigo-500 hover:text-white transition-colors" data-tag="Medium">
          Medium
        </button>
        <button class="template-tag-btn px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-indigo-500 hover:text-white transition-colors" data-tag="Large">
          Large
        </button>
      </div>
      
      <div id="templateGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        ${templates
      .map(
        (template) => `
          <div class="template-card border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all" data-template-id="${template.id
          }">
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-semibold text-gray-900">${template.name}</h4>
              ${template.isDefault
            ? "<span class=\"px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full\">Default</span>"
            : ""
          }
            </div>
            <p class="text-sm text-gray-600 mb-3">${template.description}</p>
            <div class="bg-gray-100 rounded p-2 mb-2">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div><span class="text-gray-600">Rows:</span> <span class="font-semibold">${template.preview.rows
          }</span></div>
                <div><span class="text-gray-600">Seats/Row:</span> <span class="font-semibold">${template.preview.seatsPerRow
          }</span></div>
                <div class="col-span-2"><span class="text-gray-600">Total:</span> <span class="font-semibold">${template.preview.totalSeats
          } seats</span></div>
              </div>
            </div>
            <div class="flex gap-1 flex-wrap">
              ${template.tags
            .map(
              (tag) =>
                `<span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">${tag}</span>`
            )
            .join("")}
            </div>
          </div>
        `
      )
      .join("")}
      </div>
    </div>
  `;
}

export function initTemplateSelector(onSelect) {
  let allTemplates = [];
  let filteredTemplates = [];

  templateService.getAll().then((templates) => {
    allTemplates = templates;
    filteredTemplates = templates;
  });

  $(document).on("input", "#templateSearch", function () {
    const query = $(this).val().toLowerCase();
    filterTemplates(query, null);
  });

  $(document).on("click", ".template-tag-btn", function () {
    $(".template-tag-btn")
      .removeClass("bg-indigo-500 text-white")
      .addClass("bg-gray-200 text-gray-700");
    $(this)
      .removeClass("bg-gray-200 text-gray-700")
      .addClass("bg-indigo-500 text-white");

    const tag = $(this).data("tag");
    const query = $("#templateSearch").val().toLowerCase();
    filterTemplates(query, tag);
  });

  $(document).on("click", ".template-card", function () {
    const templateId = $(this).data("template-id");
    if (onSelect) {
      onSelect(templateId);
    }
  });

  function filterTemplates(query, tag) {
    filteredTemplates = allTemplates.filter((template) => {
      const matchesQuery =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query);

      const matchesTag = !tag || template.tags.includes(tag);

      return matchesQuery && matchesTag;
    });

    renderTemplates(filteredTemplates);
  }

  function renderTemplates(templates) {
    const html = templates
      .map(
        (template) => `
      <div class="template-card border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all" data-template-id="${template.id
          }">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-semibold text-gray-900">${template.name}</h4>
          ${template.isDefault
            ? "<span class=\"px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full\">Default</span>"
            : ""
          }
        </div>
        <p class="text-sm text-gray-600 mb-3">${template.description}</p>
        <div class="bg-gray-100 rounded p-2 mb-2">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div><span class="text-gray-600">Rows:</span> <span class="font-semibold">${template.preview.rows
          }</span></div>
            <div><span class="text-gray-600">Seats/Row:</span> <span class="font-semibold">${template.preview.seatsPerRow
          }</span></div>
            <div class="col-span-2"><span class="text-gray-600">Total:</span> <span class="font-semibold">${template.preview.totalSeats
          } seats</span></div>
          </div>
        </div>
        <div class="flex gap-1 flex-wrap">
          ${template.tags
            .map(
              (tag) =>
                `<span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">${tag}</span>`
            )
            .join("")}
        </div>
      </div>
    `
      )
      .join("");

    $("#templateGrid").html(
      html ||
      "<p class=\"text-gray-500 text-center col-span-3\">No templates found</p>"
    );
  }
}
