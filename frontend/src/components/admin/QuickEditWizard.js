import { PerformanceWizardHandler } from "./PerformanceWizardHandler.js";

export async function openQuickEdit(performance, venues, onSave) {
  const wizard = new PerformanceWizardHandler(venues, async (formData) => {
    const updatedData = {
      ...performance,
      ...formData,
      showtimes: formData.showtimes.map((st) => ({
        dateTime: `${st.date}T${st.time}:00`,
        totalSeats: 200,
        availableSeats: 200,
      })),
    };

    await onSave(updatedData);
  });

  await wizard.show(performance);
}
