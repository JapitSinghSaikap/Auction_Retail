const express  = require('express');
const router   = express.Router();
const { Item, Bid } = require('../models');
const {
  calculateWinProbability,
  suggestBid,
  calculateDealScore,
  detectShillBidding,
} = require('../intelligence');

// GET /api/intelligence/:itemId/analysis?userId=xxx
router.get('/:itemId/analysis', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId }  = req.query;

    const item = await Item.findByPk(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const bids = await Bid.findAll({
      where: { itemId },
      order: [['amount', 'DESC']],
    });

    const now         = Date.now();
    const endTime     = new Date(item.endTime).getTime();
    const timeLeft    = Math.max(0, endTime - now);
    const oneHourAgo  = now - 60 * 60 * 1000;
    const recentBids  = bids.filter((b) => new Date(b.createdAt).getTime() > oneHourAgo).length;
    const bidVelocity = recentBids; // bids/hour

    const startingPrice = item.startingPrice || 1;
    const currentPrice  = item.currentPrice  || startingPrice;
    const priceRise     = Math.round(((currentPrice - startingPrice) / startingPrice) * 100);

    const bidsPlain = bids.map((b) => b.toJSON());

    const winProbability = userId
      ? calculateWinProbability(item.toJSON(), userId, bidsPlain)
      : 0;

    const suggestedBid   = suggestBid(item.toJSON(), bidsPlain);
    const dealScore      = calculateDealScore(item.toJSON(), bidsPlain);
    const shillWarnings  = await detectShillBidding(itemId, item.sellerId);

    res.json({
      winProbability,
      suggestedBid,
      dealScore,
      shillWarnings,
      timeLeft,
      bidVelocity,
      priceRise,
    });
  } catch (err) {
    console.error('Intelligence error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
