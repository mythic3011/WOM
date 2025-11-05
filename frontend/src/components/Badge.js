export function createBadge({
  text,
  variant = "default",
  size = "md",
  icon = "",
}) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-indigo-100 text-indigo-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.md;

  return `
    <span class="inline-flex items-center rounded-full font-medium ${variantClass} ${sizeClass}">
      ${icon ? `<i class="fas ${icon} mr-1"></i>` : ""}
      ${text}
    </span>
  `;
}
