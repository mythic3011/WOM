export function renderEmptyState(containerId, icon = "fa-inbox", message = "No data available") {
  const $container = $(containerId);
  $container.html(`
    <div class="text-center text-gray-500 py-8">
      <i class="fas ${icon} text-4xl mb-2"></i>
      <p>${message}</p>
    </div>
  `);
}

export function attachRowHoverEffects(tableSelector = "tbody") {
  $(document).on("mouseenter", `${tableSelector} tr`, function() {
    $(this).addClass("bg-gray-50 shadow-sm");
  }).on("mouseleave", `${tableSelector} tr`, function() {
    $(this).removeClass("bg-gray-50 shadow-sm");
  });
}

export function clearTable(tableSelector) {
  $(tableSelector).empty();
}

export function renderTableRows($tbody, data, renderRowFn) {
  $tbody.empty();
  
  if (!data || data.length === 0) {
    const colCount = $tbody.closest("table").find("thead th").length;
    $tbody.append(`
      <tr>
        <td colspan="${colCount}" class="px-6 py-8 text-center text-gray-500">
          No data available
        </td>
      </tr>
    `);
    return;
  }
  
  data.forEach(item => {
    const row = renderRowFn(item);
    $tbody.append(row);
  });
}

export function initTableFilters(config) {
  const { 
    searchInputId, 
    filterSelectors = [], 
    clearButtonId,
    onFilter 
  } = config;

  if (searchInputId) {
    $(`#${searchInputId}`).on("input", function() {
      if (onFilter) onFilter();
    });
  }

  filterSelectors.forEach(selector => {
    $(selector).on("change", function() {
      if (onFilter) onFilter();
    });
  });

  if (clearButtonId) {
    $(`#${clearButtonId}`).on("click", function() {
      if (searchInputId) $(`#${searchInputId}`).val("");
      filterSelectors.forEach(selector => $(selector).val(""));
      if (onFilter) onFilter();
    });
  }
}


