export function createZoneEditor(zones = [], pricingSections = []) {
  return `
    <div class="zone-editor">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Pricing Zones</h3>
        <p class="text-sm text-gray-600 mb-4">Define zones on the seat map to organize pricing and categories</p>
        
        <button id="addZoneBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-plus mr-2"></i>Add Zone
        </button>
      </div>
      
      <div id="zonesList" class="space-y-3">
        ${
          zones.length === 0
            ? "<p class=\"text-gray-500 text-sm\">No zones defined. Click \"Add Zone\" to create your first pricing zone.</p>"
            : zones
                .map(
                  (zone, index) => `
          <div class="zone-item border border-gray-300 rounded-lg p-4" data-zone-index="${index}">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded" style="background-color: ${
                  zone.color
                }"></div>
                <div>
                  <h4 class="font-semibold text-gray-900">${zone.name}</h4>
                  <p class="text-xs text-gray-600">${
                    zone.seats.length
                  } seats</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button class="edit-zone-btn px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm" data-zone-index="${index}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="delete-zone-btn px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm" data-zone-index="${index}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="text-sm text-gray-600">
              <span>Pricing: ${
                pricingSections[zone.sectionIndex]?.category || "N/A"
              }</span>
            </div>
          </div>
        `
                )
                .join("")
        }
      </div>
    </div>
  `;
}

export function showZoneEditorDialog(zones, pricingSections, onSave) {
  const colors = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  Swal.fire({
    title: "Add Pricing Zone",
    html: `
      <div class="text-left space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Zone Name</label>
          <input type="text" id="zoneName" class="swal2-input w-full" placeholder="e.g., Orchestra, Balcony Left">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Zone Color</label>
          <div class="flex gap-2 flex-wrap">
            ${colors
              .map(
                (color) => `
              <div class="zone-color-option w-10 h-10 rounded cursor-pointer border-2 border-transparent hover:border-gray-400 transition-colors" 
                   style="background-color: ${color}" 
                   data-color="${color}"></div>
            `
              )
              .join("")}
          </div>
          <input type="hidden" id="zoneColor" value="${colors[0]}">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Pricing Section</label>
          <select id="zonePricingSection" class="swal2-select w-full">
            ${pricingSections
              .map(
                (section, index) => `
              <option value="${index}">${section.category} - $${section.price}</option>
            `
              )
              .join("")}
          </select>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            After creating this zone, select seats on the map to assign them to this zone.
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Create Zone",
    didOpen: () => {
      $(".zone-color-option").on("click", function () {
        $(".zone-color-option")
          .removeClass("border-gray-800")
          .addClass("border-transparent");
        $(this).removeClass("border-transparent").addClass("border-gray-800");
        $("#zoneColor").val($(this).data("color"));
      });

      $(".zone-color-option").first().click();
    },
    preConfirm: () => {
      const name = $("#zoneName").val().trim();
      const color = $("#zoneColor").val();
      const sectionIndex = parseInt($("#zonePricingSection").val());

      if (!name) {
        Swal.showValidationMessage("Please enter a zone name");
        return false;
      }

      return { name, color, sectionIndex, seats: [] };
    },
  }).then((result) => {
    if (result.isConfirmed && onSave) {
      onSave(result.value);
    }
  });
}
