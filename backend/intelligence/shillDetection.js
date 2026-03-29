const { Bid, Item } = require('../models');
const { Op } = require('sequelize');

/**
 * Shill Bidding Detection — pure heuristics, no external APIs
 */
async function detectShillBidding(itemId, sellerId) {
  const warnings  = [];
  let riskLevel   = 'Low';

  try {
    const bids = await Bid.findAll({
      where: { itemId },
      order: [['createdAt', 'ASC']],
    });

    if (bids.length === 0) {
      return { isSuspicious: false, warnings: [], riskLevel: 'Low' };
    }

    // Check 1: Any user bid > 3 times on same item
    const bidCounts = {};
    bids.forEach((b) => {
      const uid = String(b.userId);
      bidCounts[uid] = (bidCounts[uid] || 0) + 1;
    });
    const heavyBidders = Object.entries(bidCounts).filter(([, c]) => c > 3);
    if (heavyBidders.length > 0) {
      warnings.push(`${heavyBidders.length} user(s) placed more than 3 bids — unusual pattern`);
      riskLevel = 'Medium';
    }

    // Check 2: Rapid bidding — same user bids within 10 seconds of themselves
    const bidsByUser = {};
    bids.forEach((b) => {
      const uid = String(b.userId);
      if (!bidsByUser[uid]) bidsByUser[uid] = [];
      bidsByUser[uid].push(new Date(b.createdAt).getTime());
    });
    for (const [uid, times] of Object.entries(bidsByUser)) {
      for (let i = 1; i < times.length; i++) {
        if (times[i] - times[i - 1] < 10000) {
          warnings.push(`User placed bids within 10 seconds of each other`);
          riskLevel = 'High';
          break;
        }
      }
    }

    // Check 3: A suspicious bidder appears across multiple seller auctions
    if (heavyBidders.length > 0) {
      const suspiciousUserIds = heavyBidders.map(([uid]) => uid);

      const sellerItems = await Item.findAll({
        where: { sellerId },
        attributes: ['id'],
      });
      const sellerItemIds = sellerItems.map((i) => i.id);

      if (sellerItemIds.length > 1) {
        const crossBids = await Bid.findAll({
          where: {
            userId: { [Op.in]: suspiciousUserIds },
            itemId: { [Op.in]: sellerItemIds, [Op.ne]: itemId },
          },
        });
        if (crossBids.length > 0) {
          warnings.push(`Suspicious bidders detected across multiple auctions by same seller`);
          riskLevel = 'High';
        }
      }
    }

    const isSuspicious = warnings.length > 0;
    return { isSuspicious, warnings, riskLevel };
  } catch (err) {
    return { isSuspicious: false, warnings: [], riskLevel: 'Low' };
  }
}

module.exports = { detectShillBidding };
