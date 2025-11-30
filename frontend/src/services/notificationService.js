/**
 * @file notificationService.js
 * @description Service for managing user notifications dynamically
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency @config/routes.js
 * @dependency ./storageService.js
 * @see storageService.js
 */

import { ROUTES } from "@config/routes.js";
import { storage } from "./storageService.js";

const STORAGE_KEY = "notifications";
const MAX_NOTIFICATIONS = 10;

/**
 * @class NotificationService
 * @description Manages user notifications with storage and listeners
 */
class NotificationService {
    /**
     * @description Creates an instance of NotificationService
     */
    constructor() {
        this.listeners = [];
    }

    /**
     * @description Gets notifications for current user
     * @returns {Array} Array of notification objects
     */
    getNotifications() {
        const notifications = storage.get(STORAGE_KEY, []);
        return Array.isArray(notifications) ? notifications : [];
    }

    /**
     * Add a new notification
     * @param {Object} notification - Notification object
     */
    addNotification(notification) {
        const notifications = this.getNotifications();

        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            read: false,
            ...notification
        };

        notifications.unshift(newNotification);

        // Keep only recent notifications
        const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);

        storage.set(STORAGE_KEY, trimmed);
        this.notifyListeners();

        return newNotification;
    }

    /**
     * Mark notification as read
     * @param {string|number} notificationId
     */
    markAsRead(notificationId) {
        const notifications = this.getNotifications();
        const updated = notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );

        storage.set(STORAGE_KEY, updated);
        this.notifyListeners();
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
        const notifications = this.getNotifications();
        const updated = notifications.map(n => ({ ...n, read: true }));

        storage.set(STORAGE_KEY, updated);
        this.notifyListeners();
    }

    /**
     * Delete a notification
     * @param {string|number} notificationId
     */
    deleteNotification(notificationId) {
        const notifications = this.getNotifications();
        const filtered = notifications.filter(n => n.id !== notificationId);

        storage.set(STORAGE_KEY, filtered);
        this.notifyListeners();
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        storage.remove(STORAGE_KEY);
        this.notifyListeners();
    }

    /**
     * Get unread notification count
     * @returns {number}
     */
    getUnreadCount() {
        const notifications = this.getNotifications();
        return notifications.filter(n => !n.read).length;
    }

    /**
     * Subscribe to notification changes
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners of changes
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getNotifications());
            } catch (error) {
                console.error("Error in notification listener:", error);
            }
        });
    }

    /**
     * Get default welcome notifications for guests
     * @returns {Array}
     */
    getGuestNotifications() {
        return [
            {
                id: "guest-1",
                icon: "fa-star",
                iconColor: "text-yellow-500",
                title: "Welcome to WOM",
                message: "Sign up to book your first performance",
                time: "Just now",
                link: ROUTES.AUTH.REGISTER,
                read: false
            },
            {
                id: "guest-2",
                icon: "fa-music",
                iconColor: "text-indigo-500",
                title: "Featured This Month",
                message: "Mozart's Requiem - Now on sale",
                time: "1 hour ago",
                link: ROUTES.PUBLIC.PERFORMANCES,
                read: false
            },
            {
                id: "guest-3",
                icon: "fa-calendar",
                iconColor: "text-blue-500",
                title: "Upcoming Events",
                message: "10 performances scheduled this month",
                time: "2 hours ago",
                link: ROUTES.PUBLIC.PERFORMANCES,
                read: false
            }
        ];
    }

    /**
     * Format timestamp to relative time
     * @param {number} timestamp
     * @returns {string}
     */
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) {return "Just now";}
        if (minutes < 60) {return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;}
        if (hours < 24) {return `${hours} hour${hours > 1 ? "s" : ""} ago`;}
        return `${days} day${days > 1 ? "s" : ""} ago`;
    }
}

export const notificationService = new NotificationService();

// Helper functions for common notification types
export const notificationHelpers = {
    bookingConfirmed(bookingId, performanceTitle, seatInfo) {
        return notificationService.addNotification({
            icon: "fa-ticket-alt",
            iconColor: "text-green-500",
            title: "Booking Confirmed",
            message: `${performanceTitle} - ${seatInfo}`,
            link: ROUTES.USER.BOOKINGS,
        });
    },

    bookingReminder(performanceTitle, showtime) {
        return notificationService.addNotification({
            icon: "fa-bell",
            iconColor: "text-orange-500",
            title: "Performance Reminder",
            message: `${performanceTitle} starts ${showtime}`,
            link: ROUTES.USER.BOOKINGS,
        });
    },

    newPerformance(performanceTitle) {
        return notificationService.addNotification({
            icon: "fa-music",
            iconColor: "text-blue-500",
            title: "New Performance Available",
            message: `${performanceTitle} - Early bird tickets available`,
            link: ROUTES.PUBLIC.PERFORMANCES,
        });
    },

    adminAlert(title, message, link = ROUTES.ADMIN.DASHBOARD) {
        return notificationService.addNotification({
            icon: "fa-exclamation-triangle",
            iconColor: "text-red-500",
            title,
            message,
            link,
        });
    }
};

export default notificationService;
