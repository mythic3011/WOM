/**
 * Calendar utility for generating iCalendar (.ics) files
 * Supports Google Calendar, Apple Calendar, Outlook, and other iCal-compatible apps
 */

import { CALENDAR_CONFIG } from '@config/config.js';

/**
 * Escape special characters for iCalendar format
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeICalText(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Fold long lines according to RFC 5545 (max 75 octets per line)
 * @param {string} line - Line to fold
 * @returns {string} Folded line
 */
function foldLine(line) {
    if (line.length <= 75) return line;

    const result = [];
    let currentLine = line;

    while (currentLine.length > 75) {
        result.push(currentLine.substring(0, 75));
        currentLine = ' ' + currentLine.substring(75);
    }
    result.push(currentLine);

    return result.join('\r\n');
}

/**
 * Generate iCalendar file content with enhanced formatting
 * @param {Object} event - Event details
 * @returns {string} iCalendar format string
 */
export function generateICalendar(event) {
    const {
        title,
        description = '',
        location = '',
        startDate,
        endDate,
        url = '',
        organizer = CALENDAR_CONFIG.organizer.name,
        alarm = CALENDAR_CONFIG.alarm.enabled,
        alarmMinutes = CALENDAR_CONFIG.alarm.minutesBefore,
        categories = CALENDAR_CONFIG.categories
    } = event;

    // Format dates to iCalendar format (YYYYMMDDTHHMMSSZ)
    const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Calculate end date using config default duration if not provided
    const start = new Date(startDate);
    const end = endDate
        ? new Date(endDate)
        : new Date(start.getTime() + CALENDAR_CONFIG.defaultDuration * 60 * 60 * 1000);

    // Build event lines
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${CALENDAR_CONFIG.prodId}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${CALENDAR_CONFIG.calendarName}`,
        `X-WR-TIMEZONE:${CALENDAR_CONFIG.timezone}`,
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random().toString(36).substring(2, 11)}@${CALENDAR_CONFIG.organizer.email.split('@')[1]}`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        foldLine(`SUMMARY:${escapeICalText(title)}`),
    ];

    // Add description with proper formatting
    if (description) {
        lines.push(foldLine(`DESCRIPTION:${escapeICalText(description)}`));
    }

    // Add location
    if (location) {
        lines.push(foldLine(`LOCATION:${escapeICalText(location)}`));
    }

    // Add URL
    if (url) {
        lines.push(`URL:${url}`);
    }

    // Add organizer
    if (organizer) {
        lines.push(`ORGANIZER;CN=${escapeICalText(organizer)}:${CALENDAR_CONFIG.getOrganizerMailto()}`);
    }

    // Add categories
    if (categories && categories.length > 0) {
        lines.push(`CATEGORIES:${categories.map(escapeICalText).join(',')}`);
    }

    // Add status and other properties from config
    lines.push(
        `STATUS:${CALENDAR_CONFIG.status}`,
        `TRANSP:${CALENDAR_CONFIG.transparency}`,
        'SEQUENCE:0',
        `CLASS:${CALENDAR_CONFIG.eventClass}`
    );

    // Add alarm/reminder
    if (alarm) {
        lines.push(
            'BEGIN:VALARM',
            `TRIGGER:${CALENDAR_CONFIG.getAlarmTrigger()}`,
            `ACTION:${CALENDAR_CONFIG.alarm.action}`,
            foldLine(`DESCRIPTION:Reminder: ${escapeICalText(title)}`),
            'END:VALARM'
        );
    }

    lines.push('END:VEVENT', 'END:VCALENDAR');

    return lines.join('\r\n');
}

/**
 * Download iCalendar file
 * @param {Object} event - Event details
 * @param {string} filename - Optional filename
 */
export function downloadICalendar(event, filename = 'event.ics') {
    const icsContent = generateICalendar(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Generate iCalendar for a booking with enhanced details
 * @param {Object} booking - Booking object
 * @returns {string} iCalendar content
 */
export function generateBookingCalendar(booking) {
    const { seatLabels } = extractSeatLabels(booking);

    // Build detailed description
    const descriptionParts = [
        `Performance: ${booking.performanceTitle || 'Event'}`,
        '',
        `Booking Reference: ${booking.bookingReference || booking.id}`,
    ];

    if (seatLabels.length > 0) {
        descriptionParts.push(`Seats: ${seatLabels.join(', ')}`);
    }

    if (booking.amount) {
        descriptionParts.push(`Total: HKD ${Number(booking.amount).toLocaleString()}`);
    }

    descriptionParts.push(
        '',
        'Manage your booking:',
        CALENDAR_CONFIG.getBookingsUrl(),
        '',
        `IMPORTANT: Please arrive ${CALENDAR_CONFIG.instructions.arrivalTime} minutes before the performance starts.`,
        CALENDAR_CONFIG.instructions.reminderText
    );

    return generateICalendar({
        title: booking.performanceTitle || 'Performance',
        description: descriptionParts.join('\n'),
        location: booking.venueName || booking.venue?.name || booking.venue || 'Venue TBA',
        startDate: booking.performanceDate,
        url: CALENDAR_CONFIG.getBookingsUrl(),
        organizer: CALENDAR_CONFIG.organizer.name,
        alarm: CALENDAR_CONFIG.alarm.enabled,
        alarmMinutes: CALENDAR_CONFIG.alarm.minutesBefore,
        categories: CALENDAR_CONFIG.categories
    });
}

/**
 * Download booking as iCalendar file with improved filename
 * @param {Object} booking - Booking object
 */
export function downloadBookingCalendar(booking) {
    // Create a clean filename
    const date = new Date(booking.performanceDate);
    const dateStr = date.toISOString().split('T')[0];
    const titleSlug = (booking.performanceTitle || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);

    const filename = `wom-${titleSlug}-${dateStr}.ics`;

    const icsContent = generateBookingCalendar(booking);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Extract seat labels from booking (supports both old and new format)
 */
function extractSeatLabels(booking) {
    // New format with seatTickets
    if (booking.seatTickets && Array.isArray(booking.seatTickets) && booking.seatTickets.length > 0) {
        return {
            seatLabels: booking.seatTickets.map(st => st.seatLabel || st.seatId),
            isNewFormat: true
        };
    }

    // Old format with seats
    if (booking.seats) {
        const seatArray = Array.isArray(booking.seats) ? booking.seats : [booking.seats];
        return {
            seatLabels: seatArray.map(s => typeof s === 'string' ? s : s.fullId || s.seatId || s),
            isNewFormat: false
        };
    }

    return { seatLabels: [], isNewFormat: false };
}
