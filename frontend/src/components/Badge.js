export function createBadge({
  text,
  variant = "default",
  size = "md",
  icon = "",
}) {
  const variants = {
    default: "bg-gray-100 text-gray-700 border border-gray-300",
    primary: "bg-indigo-100 text-indigo-700 border border-indigo-300",
    success: "bg-green-100 text-green-700 border border-green-300",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    danger: "bg-red-100 text-red-700 border border-red-300",
    info: "bg-blue-100 text-blue-700 border border-blue-300",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.md;

  return `
    <span class="inline-flex items-center gap-1 rounded-full font-semibold shadow-sm ${variantClass} ${sizeClass}">
      ${icon ? `<i class="fas ${icon}"></i>` : ""}
      ${text}
    </span>
  `;
}
