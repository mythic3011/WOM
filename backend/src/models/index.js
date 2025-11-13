import User from "./User.js";
import Performance from "./Performance.js";
import Booking from "./Booking.js";
import Venue from "./Venue.js";
import TicketType from "./TicketType.js";

Performance.belongsTo(Venue, { foreignKey: "venueId", as: "venue" });
Venue.hasMany(Performance, { foreignKey: "venueId", as: "performances" });

Booking.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Booking, { foreignKey: "userId", as: "bookings" });

Booking.belongsTo(Performance, {
  foreignKey: "performanceId",
  as: "performance",
});
Performance.hasMany(Booking, { foreignKey: "performanceId", as: "bookings" });

export { User, Performance, Booking, Venue, TicketType };

export default {
  User,
  Performance,
  Booking,
  Venue,
  TicketType,
};
