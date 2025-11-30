/**
 * @file dateUtils.js
 * @description Date and time utilities using dayjs with Hong Kong timezone support
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency dayjs
 * @see backend/src/services
 */

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

/**
 * @param {Date|string} date - Date to format
 * @param {string} [format="YYYY-MM-DD"] - Output format string
 * @returns {string} Formatted date string in Hong Kong timezone
 */
export const formatDate = (date, format = "YYYY-MM-DD") =>
  dayjs(date).tz(DEFAULT_TIMEZONE).format(format);

/**
 * @param {Date|string} date - Date to format
 * @param {string} [format="YYYY-MM-DD HH:mm:ss"] - Output format string
 * @returns {string} Formatted datetime string in Hong Kong timezone
 */
export const formatDateTime = (date, format = "YYYY-MM-DD HH:mm:ss") =>
  dayjs(date).tz(DEFAULT_TIMEZONE).format(format);

/**
 * @param {Date|string} date - Date to format
 * @param {string} [format="HH:mm"] - Output format string
 * @returns {string} Formatted time string in Hong Kong timezone
 */
export const formatTime = (date, format = "HH:mm") =>
  dayjs(date).tz(DEFAULT_TIMEZONE).format(format);

/**
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export const fromNow = (date) => dayjs(date).fromNow();

/**
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string (e.g., "in 2 hours")
 */
export const toNow = (date) => dayjs(date).toNow();

/**
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export const addDays = (date, days) => dayjs(date).add(days, "day").toDate();

/**
 * @param {Date|string} date - Base date
 * @param {number} hours - Number of hours to add
 * @returns {Date} New date with hours added
 */
export const addHours = (date, hours) => dayjs(date).add(hours, "hour").toDate();

/**
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to subtract
 * @returns {Date} New date with days subtracted
 */
export const subtractDays = (date, days) => dayjs(date).subtract(days, "day").toDate();

/**
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if date1 is after date2
 */
export const isAfter = (date1, date2) => dayjs(date1).isAfter(date2);

/**
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if date1 is before date2
 */
export const isBefore = (date1, date2) => dayjs(date1).isBefore(date2);

/**
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if dates are on the same day
 */
export const isSameDay = (date1, date2) => dayjs(date1).isSame(date2, "day");

/**
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Range start date
 * @param {Date|string} endDate - Range end date
 * @returns {boolean} True if date is between start and end (inclusive)
 */
export const isBetweenDates = (date, startDate, endDate) =>
  dayjs(date).isBetween(startDate, endDate, null, "[]");

/**
 * @param {Date|string} [date=new Date()] - Input date
 * @returns {Date} Start of day (00:00:00)
 */
export const getStartOfDay = (date = new Date()) => dayjs(date).startOf("day").toDate();

/**
 * @param {Date|string} [date=new Date()] - Input date
 * @returns {Date} End of day (23:59:59)
 */
export const getEndOfDay = (date = new Date()) => dayjs(date).endOf("day").toDate();

/**
 * @param {Date|string} [date=new Date()] - Input date
 * @returns {Date} Start of month (first day at 00:00:00)
 */
export const getStartOfMonth = (date = new Date()) =>
  dayjs(date).startOf("month").toDate();

/**
 * @param {Date|string} [date=new Date()] - Input date
 * @returns {Date} End of month (last day at 23:59:59)
 */
export const getEndOfMonth = (date = new Date()) => dayjs(date).endOf("month").toDate();

/**
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Number of days difference
 */
export const getDaysDifference = (date1, date2) => dayjs(date1).diff(date2, "day");

/**
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Number of hours difference
 */
export const getHoursDifference = (date1, date2) => dayjs(date1).diff(date2, "hour");

/**
 * @param {string} dateString - Date string to parse
 * @param {string} [format="YYYY-MM-DD"] - Input format string
 * @returns {Date} Parsed date object
 */
export const parseDate = (dateString, format = "YYYY-MM-DD") =>
  dayjs(dateString, format).toDate();

/**
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (date) => dayjs(date).isValid();

/**
 * @returns {string} Current timestamp in ISO format
 */
export const getCurrentTimestamp = () => dayjs().toISOString();

/**
 * @returns {Date} Current date and time in Hong Kong timezone
 */
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
