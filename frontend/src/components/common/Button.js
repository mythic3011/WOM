export function createButton({
    text,
    icon = "",
    variant = "primary",
    size = "md",
    type = "button",
    className = "",
    onClick = "",
    disabled = false,
    id = "",
}) {
    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        secondary: "bg-gray-600 hover:bg-gray-700 text-white",
        success: "bg-green-600 hover:bg-green-700 text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
        outline: "border-2 border-gray-300 hover:bg-gray-50 text-gray-700",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
    };

    const baseClasses =
        "rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50 inline-flex items-center justify-center";
    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;
    const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

    return `
    <button
      type="${type}"
      ${id ? `id="${id}"` : ""}
      ${onClick ? `onclick="${onClick}"` : ""}
      ${disabled ? "disabled" : ""}
      class="${baseClasses} ${variantClass} ${sizeClass} ${disabledClass} ${className}"
    >
      ${icon ? `<i class="fas ${icon} ${text ? "mr-2" : ""}"></i>` : ""}
      ${text ? `<span>${text}</span>` : ""}
    </button>
  `;
}

export function createIconButton({
    icon,
    variant = "primary",
    size = "md",
    className = "",
    onClick = "",
    title = "",
}) {
    return createButton({
        icon,
        variant,
        size,
        className,
        onClick,
        text: "",
        title,
    });
}
