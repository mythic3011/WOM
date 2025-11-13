import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import { formatDateTime } from "../utils/dateUtils.js";

const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "test@ethereal.email",
        pass: "test",
      },
    });
  }
};

export const sendBookingConfirmation = async (booking, user, performance) => {
  try {
    const transporter = createTransporter();

    const seatsList = booking.seats
      .map((seat) => `${seat.section} - Row ${seat.row}, Seat ${seat.number}`)
      .join("\n");

    const mailOptions = {
      from: process.env.SMTP_FROM || "WOM Booking <noreply@wom.hk>",
      to: user.email,
      subject: `Booking Confirmation - ${performance.title}`,
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear ${user.name},</p>
        <p>Your booking has been confirmed!</p>

        <h3>Booking Details</h3>
        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
        <p><strong>Performance:</strong> ${performance.title}</p>
        <p><strong>Date:</strong> ${formatDateTime(performance.date)}</p>
        <p><strong>Venue:</strong> ${performance.venueName}</p>

        <h3>Seats</h3>
        <pre>${seatsList}</pre>

        <h3>Payment</h3>
        <p><strong>Total Amount:</strong> HKD ${booking.totalAmount}</p>
        <p><strong>Payment Status:</strong> ${booking.paymentStatus}</p>

        <p>Thank you for choosing Western Orchestral Music Booking System!</p>
        <p>We look forward to seeing you at the performance.</p>

        <hr>
        <small>This is an automated email. Please do not reply.</small>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("Booking confirmation email sent", {
      bookingId: booking.id,
      to: user.email,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send booking confirmation email", {
      error: error.message,
      bookingId: booking.id,
    });
    return { success: false, error: error.message };
  }
};

export const sendBookingCancellation = async (booking, user, performance) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || "WOM Booking <noreply@wom.hk>",
      to: user.email,
      subject: `Booking Cancellation - ${performance.title}`,
      html: `
        <h2>Booking Cancellation</h2>
        <p>Dear ${user.name},</p>
        <p>Your booking has been cancelled.</p>

        <h3>Booking Details</h3>
        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
        <p><strong>Performance:</strong> ${performance.title}</p>
        <p><strong>Date:</strong> ${formatDateTime(performance.date)}</p>

        <p>If you did not request this cancellation, please contact us immediately.</p>

        <hr>
        <small>This is an automated email. Please do not reply.</small>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("Booking cancellation email sent", {
      bookingId: booking.id,
      to: user.email,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send booking cancellation email", {
      error: error.message,
      bookingId: booking.id,
    });
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || "WOM Booking <noreply@wom.hk>",
      to: user.email,
      subject: "Welcome to Western Orchestral Music Booking System",
      html: `
        <h2>Welcome to WOM Booking!</h2>
        <p>Dear ${user.name},</p>
        <p>Thank you for registering with Western Orchestral Music Booking System.</p>

        <p>Your account has been successfully created with the following details:</p>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email}</p>

        <p>You can now browse upcoming performances and book your seats online.</p>

        <p>We hope you enjoy the wonderful world of orchestral music!</p>

        <hr>
        <small>This is an automated email. Please do not reply.</small>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("Welcome email sent", {
      userId: user.id,
      to: user.email,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send welcome email", {
      error: error.message,
      userId: user.id,
    });
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || "WOM Booking <noreply@wom.hk>",
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Dear ${user.name},</p>
        <p>We received a request to reset your password.</p>

        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>

        <p>This link will expire in 1 hour.</p>

        <p>If you did not request a password reset, please ignore this email.</p>

        <hr>
        <small>This is an automated email. Please do not reply.</small>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("Password reset email sent", {
      userId: user.id,
      to: user.email,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send password reset email", {
      error: error.message,
      userId: user.id,
    });
    return { success: false, error: error.message };
  }
};

export default {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
