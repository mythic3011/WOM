export const BookingProgress = {
  render(currentStep) {
    const steps = [
      { number: 1, label: "Select Seats", icon: "fa-chair" },
      { number: 2, label: "Choose Ticket", icon: "fa-ticket-alt" },
      { number: 3, label: "Review", icon: "fa-check-circle" },
      { number: 4, label: "Payment", icon: "fa-credit-card" },
    ];

    return `
      <div class="flex items-center justify-center w-full">
        ${steps
          .map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            return `
              <div class="flex items-center">
                <div class="flex flex-col items-center">
                  <div class="${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-600"
                  } w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors">
                    ${
                      isCompleted
                        ? '<i class="fas fa-check"></i>'
                        : `<i class="fas ${step.icon}"></i>`
                    }
                  </div>
                  <div class="mt-2 text-xs font-medium ${
                    isActive
                      ? "text-indigo-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-500"
                  }">
                    ${step.label}
                  </div>
                </div>
                ${
                  index < steps.length - 1
                    ? `
                  <div class="w-16 md:w-24 h-1 mx-2 ${
                    isCompleted ? "bg-green-600" : "bg-gray-300"
                  } transition-colors"></div>
                `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },
};
