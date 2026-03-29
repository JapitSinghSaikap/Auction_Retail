const { Op } = require('sequelize');
const { Item, Bid, Notification } = require('../models');
const { createNotification } = require('../services/notificationService');

/**
 * Runs every 15 minutes.
 * Notifies sellers + active bidders when an auction is ending within 1 hour.
 * Uses a DB check to avoid spamming the same user twice per item.
 */
async function checkEndingSoon(io) {
  const run = async () => {
    try {
      const now            = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const endingSoon = await Item.findAll({
        where: {
          status:  'active',
          endTime: { [Op.between]: [now, oneHourFromNow] },
        },
        include: [{ model: Bid, attributes: ['userId'] }],
      });

      for (const item of endingSoon) {
        // Gather user IDs to notify: seller + all unique bidders
        const bidderIds   = [...new Set(item.Bids.map((b) => String(b.userId)))];
        const targetUsers = [...new Set([String(item.sellerId), ...bidderIds])];

        for (const uid of targetUsers) {
          // Check if already notified in last 2 hours to prevent duplicates
          const existing = await Notification.findOne({
            where: {
              userId:    uid,
              itemId:    item.id,
              type:      'ending_soon',
              createdAt: { [Op.gte]: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
            },
          });
          if (existing) continue;

          await createNotification(
            io, uid, 'ending_soon',
            '⏱️ Auction Ending Soon',
            `"${item.title}" ends in less than 1 hour`,
            item.id
          );
        }
      }
    } catch (err) {
      console.error('endingSoon job error:', err.message);
    }
  };

  // Run immediately then every 15 minutes
  run();
  setInterval(run, 15 * 60 * 1000);
}

module.exports = { checkEndingSoon };
