export const QuickActionsCard = {
  render() {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fas fa-bolt text-yellow-600"></i>
          Quick Actions
        </h2>

        <div class="space-y-3">
          <div>
            <h3 class="text-xs font-semibold text-gray-600 uppercase mb-2">Authentication</h3>
            <div class="grid grid-cols-3 gap-2">
              <button id="loginAsAdmin" class="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                <i class="fas fa-user-shield mr-1"></i>Admin
              </button>
              <button id="loginAsUser" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <i class="fas fa-user mr-1"></i>User
              </button>
              <button id="logoutUser" class="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                <i class="fas fa-sign-out-alt mr-1"></i>Logout
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-gray-600 uppercase mb-2">Console</h3>
            <div class="flex gap-2">
              <button id="clearConsole" class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                <i class="fas fa-eraser mr-2"></i>Clear Console
              </button>
              <button id="testApi" class="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm">
                <i class="fas fa-flask mr-2"></i>Test API
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-gray-600 uppercase mb-2">Performance</h3>
            <div class="flex gap-2">
              <button id="runPerformanceTest" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                <i class="fas fa-tachometer-alt mr-2"></i>Run Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
