export const StorageViewerCard = {
  render() {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fas fa-database text-blue-600"></i>
          Storage Viewer
        </h2>

        <div class="space-y-3">
          <button id="viewStorage" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left">
            <i class="fas fa-eye mr-2"></i>
            <span>View All Storage</span>
          </button>

          <button id="analyzeStorage" class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left">
            <i class="fas fa-chart-pie mr-2"></i>
            <span>Analyze Storage</span>
          </button>

          <div class="grid grid-cols-2 gap-2">
            <button id="exportStorage" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
              <i class="fas fa-download mr-2"></i>Export
            </button>
            <button id="importStorage" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
              <i class="fas fa-upload mr-2"></i>Import
            </button>
          </div>

          <button id="clearStorage" class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-left">
            <i class="fas fa-trash mr-2"></i>
            <span>Clear All Storage</span>
          </button>
        </div>
      </div>
    `;
  },
};
