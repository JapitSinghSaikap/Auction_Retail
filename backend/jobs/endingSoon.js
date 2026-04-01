const { Op } = require('sequelize');
const { Item, Bid, Notification, User } = require('../models');
const { createNotification } = require('../services/notificationService');

/**
 * Closes auctions whose endTime has passed — sets status='closed' and assigns winnerId.
 */
async function closeExpiredAuctions(io) {
  try {
    const expiredItems = await Item.findAll({
      where: { status: 'active', endTime: { [Op.lt]: new Date() } },
      include: [{ model: Bid, attributes: ['id', 'userId', 'amount'] }],
    });
    for (const item of expiredItems) {
      let winnerId = null;
      if (item.Bids && item.Bids.length > 0) {
        const highest = item.Bids.reduce((max, b) => (b.amount > max.amount ? b : max), item.Bids[0]);
        winnerId = highest.userId;
      }
      await item.update({ status: 'closed', winnerId });

      // Notify the winner
      if (winnerId) {
        await createNotification(
          io, winnerId, 'won',
          '🏆 You Won!',
          `Congratulations! You won "${item.title}" with a bid of ₹${item.currentPrice}`,
          item.id
        );
      }
    }
    if (expiredItems.length > 0) {
      console.log(`Closed ${expiredItems.length} expired auction(s).`);
    }
  } catch (err) {
    console.error('closeExpiredAuctions error:', err.message);
  }
}

/**
 * Runs every 15 minutes.
 * 1. Closes expired auctions and assigns winners.
 * 2. Notifies sellers + active bidders when an auction is ending within 1 hour.
 * Uses a DB check to avoid spamming the same user twice per item.
 */
async function checkEndingSoon(io) {
  const run = async () => {
    try {
      // First close any expired auctions
      await closeExpiredAuctions(io);

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

  // Also close expired auctions every 30 seconds for faster winner assignment
  setInterval(() => closeExpiredAuctions(io), 30 * 1000);
}

module.exports = { checkEndingSoon };
