export function renderEmptyState(
  containerId,
  icon = "fa-inbox",
  message = "No data available"
) {
  const $container = $(containerId);
  $container.html(`
    <div class="text-center text-gray-500 py-8">
      <i class="fas ${icon} text-4xl mb-2"></i>
      <p>${message}</p>
    </div>
  `);
}
