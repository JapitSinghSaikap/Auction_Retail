const { Notification } = require('../models');

/**
 * Create a persistent notification in DB and optionally push via socket.
 * @param {object} io         - socket.io server instance (optional)
 * @param {number} userId     - recipient user id
 * @param {string} type       - notification type enum
 * @param {string} title      - short heading
 * @param {string} message    - body text
 * @param {number|null} itemId
 */
async function createNotification(io, userId, type, title, message, itemId = null) {
  try {
    const notif = await Notification.create({ userId, type, title, message, itemId });

    // Push real-time to the user's personal notification room
    if (io) {
      io.to(`notify_${userId}`).emit('newNotification', {
        id:        notif.id,
        type,
        title,
        message,
        itemId,
        isRead:    false,
        createdAt: notif.createdAt ? notif.createdAt.toISOString() : new Date().toISOString(),
      });
    }

    return notif;
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
}

module.exports = { createNotification };
