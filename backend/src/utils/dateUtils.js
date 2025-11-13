import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import isBetween from "dayjs/plugin/isBetween.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const DEFAULT_TIMEZONE = "Asia/Hong_Kong";

export const formatDate = (date, format = "YYYY-MM-DD") =>
  dayjs(date).tz(DEFAULT_TIMEZONE).format(format);

export const formatDateTime = (date, format = "YYYY-MM-DD HH:mm:ss") =>
  dayjs(date).tz(DEFAULT_TIMEZONE).format(format);

export const formatTime = (date, format = "HH:mm") =>
  dayjs(date).tz(DEFAULT_TIMEZONE).format(format);

export const fromNow = (date) => dayjs(date).fromNow();

export const toNow = (date) => dayjs(date).toNow();

export const addDays = (date, days) => dayjs(date).add(days, "day").toDate();

export const addHours = (date, hours) => dayjs(date).add(hours, "hour").toDate();

export const subtractDays = (date, days) => dayjs(date).subtract(days, "day").toDate();

export const isAfter = (date1, date2) => dayjs(date1).isAfter(date2);

export const isBefore = (date1, date2) => dayjs(date1).isBefore(date2);

export const isSameDay = (date1, date2) => dayjs(date1).isSame(date2, "day");

export const isBetweenDates = (date, startDate, endDate) =>
  dayjs(date).isBetween(startDate, endDate, null, "[]");

export const getStartOfDay = (date = new Date()) => dayjs(date).startOf("day").toDate();

export const getEndOfDay = (date = new Date()) => dayjs(date).endOf("day").toDate();

export const getStartOfMonth = (date = new Date()) =>
  dayjs(date).startOf("month").toDate();

export const getEndOfMonth = (date = new Date()) => dayjs(date).endOf("month").toDate();

export const getDaysDifference = (date1, date2) => dayjs(date1).diff(date2, "day");

export const getHoursDifference = (date1, date2) => dayjs(date1).diff(date2, "hour");

export const parseDate = (dateString, format = "YYYY-MM-DD") =>
  dayjs(dateString, format).toDate();

export const isValidDate = (date) => dayjs(date).isValid();

export const getCurrentTimestamp = () => dayjs().toISOString();

export const getCurrentHKTime = () => dayjs().tz(DEFAULT_TIMEZONE).toDate();

export default {
  formatDate,
  formatDateTime,
  formatTime,
  fromNow,
  toNow,
  addDays,
  addHours,
  subtractDays,
  isAfter,
  isBefore,
  isSameDay,
  isBetweenDates,
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  getDaysDifference,
  getHoursDifference,
  parseDate,
  isValidDate,
  getCurrentTimestamp,
  getCurrentHKTime,
};
