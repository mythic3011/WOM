import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?)?$/;

const SUPPORTED_FORMATS = [
  "YYYY-MM-DDTHH:mm:ss.SSSZ",
  "YYYY-MM-DDTHH:mm:ssZ",
  "YYYY-MM-DDTHH:mm:ss",
  "YYYY-MM-DDTHH:mm",
  "YYYY-MM-DD",
];

export const isValidTimeFormat = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!ISO_8601_REGEX.test(trimmed)) {
    return false;
  }

  for (const format of SUPPORTED_FORMATS) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) {
      return true;
    }
  }

  const parsed = dayjs(trimmed);
  return parsed.isValid();
};

export const parseTimeValue = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const parsed = dayjs(trimmed);

  if (!parsed.isValid()) {
    return null;
  }

  return parsed.toISOString();
};

export const validateTimeFields = (fieldNames = ["date"]) => (req, res, next) => {
    const errors = [];

    for (const fieldName of fieldNames) {
      const value = req.body[fieldName];

      if (value === undefined || value === null) {
        continue;
      }

      if (value === "") {
        continue;
      }

      if (!isValidTimeFormat(value)) {
        errors.push({
          field: fieldName,
          message: `Invalid time format for ${fieldName}. Expected ISO 8601 format (e.g., 2024-01-15T14:30:00Z or 2024-01-15)`,
          value: value,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Time field validation failed",
        errors,
      });
    }

    next();
  };

export const validateShowtimeFields = () => (req, res, next) => {
    const showtimes = req.body.showtimes;

    if (!showtimes || !Array.isArray(showtimes)) {
      return next();
    }

    const errors = [];

    showtimes.forEach((showtime, index) => {
      if (showtime.date && !isValidTimeFormat(showtime.date)) {
        errors.push({
          field: `showtimes[${index}].date`,
          message: `Invalid time format for showtime date. Expected ISO 8601 format`,
          value: showtime.date,
        });
      }

      if (showtime.time && typeof showtime.time === "string") {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(showtime.time)) {
          errors.push({
            field: `showtimes[${index}].time`,
            message: `Invalid time format for showtime time. Expected HH:mm or HH:mm:ss format`,
            value: showtime.time,
          });
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Showtime time field validation failed",
        errors,
      });
    }

    next();
  };

export default {
  isValidTimeFormat,
  parseTimeValue,
  validateTimeFields,
  validateShowtimeFields,
};
