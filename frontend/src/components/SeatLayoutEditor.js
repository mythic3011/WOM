import {
  renderPreview,
  summarizeCapacity,
} from "@utils/seatMapRenderer.js";

export const SeatLayoutEditor = {
  render(layout = { sections: [] }) {
    const sections =
      layout.sections && layout.sections.length
        ? layout.sections
        : [
          {
            name: "Section A",
            rows: 5,
            seatsPerRow: 8,
            tier: "standard",
            startRow: "A",
          },
        ];
    const cfg = { sections };
    const preview = renderPreview(cfg);
    const summary = summarizeCapacity(cfg);

    const sectionCards = sections
      .map((s, i) => this.renderSectionCard(s, i))
      .join("");

    return `
      <div class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded shadow">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-800">Sections</h3>
              <button id="add-section" class="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded">Add Section</button>
            </div>
            <div id="section-list" class="space-y-3">${sectionCards}</div>
          </div>
          <div class="bg-white p-4 rounded shadow">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-gray-800">Preview</h3>
              <div class="text-xs text-gray-600">
                <span class="font-semibold text-indigo-600">${summary.totalCapacity}</span> seats total
              </div>
            </div>
            <div id="seat-preview" class="overflow-auto">${preview}</div>
          </div>
        </div>
      </div>
    `;
  },

  renderSectionCard(s, i) {
    return `
      <div class="border rounded p-3" data-index="${i}">
        <div class="grid grid-cols-6 gap-2 items-end">
          <div class="col-span-2">
            <label class="block text-xs text-gray-600">Name</label>
            <input type="text" class="w-full border px-2 py-1 rounded text-sm section-name" value="${s.name || "Section"
      }">
          </div>
          <div>
            <label class="block text-xs text-gray-600">Rows</label>
            <input type="number" min="1" max="200" class="w-full border px-2 py-1 rounded text-sm section-rows" value="${s.rows || 1
      }">
          </div>
          <div>
            <label class="block text-xs text-gray-600">Seats/Row</label>
            <input type="number" min="1" max="200" class="w-full border px-2 py-1 rounded text-sm section-seats" value="${s.seatsPerRow || 1
      }">
          </div>
          <div>
            <label class="block text-xs text-gray-600">Tier</label>
            <select class="w-full border px-2 py-1 rounded text-sm section-tier">
              ${["vip", "premium", "standard", "economy"]
        .map(
          (t) =>
            `<option value="${t}" ${s.tier === t ? "selected" : ""
            }>${t}</option>`
        )
        .join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-600">Start Row</label>
            <input type="text" maxlength="3" class="w-full border px-2 py-1 rounded text-sm section-start" value="${s.startRow || "A"
      }">
          </div>
        </div>
        <div class="mt-2 flex justify-between">
          <button class="px-2 py-1 text-xs bg-gray-100 rounded border refresh-section">Update</button>
          <button class="px-2 py-1 text-xs bg-red-50 text-red-600 rounded border border-red-200 remove-section">Remove</button>
        </div>
      </div>
    `;
  },

  bind(container, initialLayout = { sections: [] }) {
    const state = {
      sections: JSON.parse(JSON.stringify(initialLayout.sections || [])),
    };
    if (!state.sections.length)
      {state.sections = [
        {
          name: "Section A",
          rows: 5,
          seatsPerRow: 8,
          tier: "standard",
          startRow: "A",
        },
      ];}

    const renderAll = () => {
      $(container).html(this.render({ sections: state.sections }));
      this.bindEvents(container, state);
    };

    renderAll();
    return {
      getValue: () => ({ sections: state.sections }),
      setValue: (layout) => {
        state.sections = layout?.sections || [];
        renderAll();
      },
    };
  },

  bindEvents(container, state) {
    $(container).off();

    $(container).on("click", "#add-section", () => {
      state.sections.push({
        name: `Section ${state.sections.length + 1}`,
        rows: 5,
        seatsPerRow: 8,
        tier: "standard",
        startRow: "A",
      });
      $(container).html(this.render({ sections: state.sections }));
      this.bindEvents(container, state);
    });

    $(container).on("click", ".remove-section", function () {
      const idx = parseInt($(this).closest("[data-index]").attr("data-index"));
      state.sections.splice(idx, 1);
      $(container).html(SeatLayoutEditor.render({ sections: state.sections }));
      SeatLayoutEditor.bindEvents(container, state);
    });

    $(container).on("click", ".refresh-section", function () {
      const $card = $(this).closest("[data-index]");
      const idx = parseInt($card.attr("data-index"));
      const s = state.sections[idx];
      s.name = $card.find(".section-name").val();
      s.rows = parseInt($card.find(".section-rows").val()) || 1;
      s.seatsPerRow = parseInt($card.find(".section-seats").val()) || 1;
      s.tier = $card.find(".section-tier").val();
      s.startRow = ($card.find(".section-start").val() || "A").toUpperCase();
      $(container).html(SeatLayoutEditor.render({ sections: state.sections }));
      SeatLayoutEditor.bindEvents(container, state);
    });
  },
};
