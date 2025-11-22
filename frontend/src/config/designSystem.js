
export const DesignSystem = {
    colors: {
        primary: {
            50: "#EEF2FF",
            100: "#E0E7FF",
            200: "#C7D2FE",
            300: "#A5B4FC",
            400: "#818CF8",
            500: "#6366F1",
            600: "#4F46E5",
            700: "#4338CA",
            800: "#3730A3",
            900: "#312E81",
        },
        success: {
            50: "#F0FDF4",
            100: "#DCFCE7",
            200: "#BBF7D0",
            300: "#86EFAC",
            400: "#4ADE80",
            500: "#22C55E",
            600: "#16A34A",
            700: "#15803D",
            800: "#166534",
            900: "#14532D",
        },
        error: {
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
        },
        warning: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
            800: "#92400E",
            900: "#78350F",
        },
        gray: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            200: "#E5E7EB",
            300: "#D1D5DB",
            400: "#9CA3AF",
            500: "#6B7280",
            600: "#4B5563",
            700: "#374151",
            800: "#1F2937",
            900: "#111827",
        },
    },

    spacing: {
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
        "3xl": "4rem",
    },

    borderRadius: {
        none: "0",
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
    },

    shadows: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    },

    buttons: {
        primary: {
            base: "px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg",
            sm: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm hover:shadow-md",
            lg: "px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl",
        },
        secondary: {
            base: "px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium shadow-sm hover:shadow",
            sm: "px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm",
            lg: "px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold text-lg shadow-sm hover:shadow-md",
        },
        success: {
            base: "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg",
            sm: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm shadow-sm hover:shadow-md",
            lg: "px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl",
        },
        danger: {
            base: "px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold shadow-md hover:shadow-lg",
            sm: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium text-sm shadow-sm hover:shadow-md",
            lg: "px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl",
        },
    },

    inputs: {
        base: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all",
        sm: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black text-sm transition-all",
        lg: "w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black text-lg transition-all",
        error: "border-red-500 focus:ring-red-500 focus:border-red-500",
        success: "border-green-500 focus:ring-green-500 focus:border-green-500",
    },

    modals: {
        sm: "500px",
        md: "700px",
        lg: "900px",
        xl: "1100px",
        "2xl": "1400px",
    },

    typography: {
        h1: "text-4xl font-bold text-gray-900",
        h2: "text-3xl font-bold text-gray-900",
        h3: "text-2xl font-bold text-gray-900",
        h4: "text-xl font-semibold text-gray-900",
        h5: "text-lg font-semibold text-gray-900",
        h6: "text-base font-semibold text-gray-900",
        body: "text-base text-gray-700",
        bodySmall: "text-sm text-gray-600",
        caption: "text-xs text-gray-500",
    },

    cards: {
        base: "bg-white rounded-lg shadow-md border border-gray-200 p-6",
        hover: "bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer",
        flat: "bg-white rounded-lg border border-gray-200 p-6",
    },
};

export const getButtonClass = (variant = "primary", size = "base") => {
    return DesignSystem.buttons[variant]?.[size] || DesignSystem.buttons.primary.base;
};

export const getInputClass = (size = "base", state = null) => {
    let classes = DesignSystem.inputs[size] || DesignSystem.inputs.base;
    if (state === "error") {
        classes += ` ${DesignSystem.inputs.error}`;
    } else if (state === "success") {
        classes += ` ${DesignSystem.inputs.success}`;
    }
    return classes;
};

export const getModalSize = (size = "md") => {
    return DesignSystem.modals[size] || DesignSystem.modals.md;
};

