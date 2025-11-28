import { PerformanceWizardHandler } from "./PerformanceWizardHandler.js";

export async function openQuickEdit(performance, venues, onSave) {
  const wizard = new PerformanceWizardHandler(venues, async (formData) => {
    const updatedData = { ...formData };

    if (formData.showtimes && formData.showtimes.length > 0) {
      const selectedVenue = venues.find((v) => v.id === formData.venueId);
      const venueCapacity = selectedVenue?.capacity || 0;

      updatedData.showtimes = formData.showtimes.map((st) => ({
        dateTime: `${st.date}T${st.time}:00`,
        totalSeats: venueCapacity,
        availableSeats: venueCapacity,
      }));
    }

    await onSave(updatedData);
  });

  await wizard.show(performance);
}
