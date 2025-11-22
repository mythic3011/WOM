import { TicketType } from "#models/index.js";
import { findEntityOrThrow } from "./helpers/entityHelpers.js";

export const getAllTicketTypes = async () => {
  const ticketTypes = await TicketType.findAll({
    where: {
      isActive: true,
    },
    order: [["name", "ASC"]],
  });

  return ticketTypes;
};

export const getTicketTypeById = async (id) => {
  const ticketType = await findEntityOrThrow(TicketType, id, "Ticket type not found");
  return ticketType;
};

export const createTicketType = async (ticketTypeData) => {
  const ticketType = await TicketType.create(ticketTypeData);
  return ticketType;
};

export const updateTicketType = async (id, updates) => {
  const ticketType = await findEntityOrThrow(TicketType, id, "Ticket type not found");
  await ticketType.update(updates);
  return ticketType;
};

export const deleteTicketType = async (id) => {
  const ticketType = await findEntityOrThrow(TicketType, id, "Ticket type not found");
  await ticketType.destroy();
  return true;
};
