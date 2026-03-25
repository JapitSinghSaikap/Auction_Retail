const { Op } = require('sequelize');
const { User, Category, Item, Bid } = require('../models');

const resolvers = {
  Query: {
    // Get all items with optional filters
    getItems: async (_, { status, categoryId }) => {
      try {
        const where = {};
        if (status) where.status = status;
        if (categoryId) where.categoryId = categoryId;

        const items = await Item.findAll({
          where,
          include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            { model: Category, as: 'category' },
            { model: Bid, attributes: ['id'] },
          ],
          order: [['createdAt', 'DESC']],
        });

        return items.map((item) => ({
          ...item.toJSON(),
          bidCount: item.Bids ? item.Bids.length : 0,
        }));
      } catch (err) {
        throw new Error('Failed to fetch items: ' + err.message);
      }
    },

    // Get single item with all associations
    getItem: async (_, { id }) => {
      try {
        const item = await Item.findByPk(id, {
          include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            { model: User, as: 'winner', attributes: ['id', 'name', 'email', 'role'] },
            { model: Category, as: 'category' },
            {
              model: Bid,
              include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
              order: [['amount', 'DESC']],
            },
          ],
        });

        if (!item) throw new Error('Item not found');

        return {
          ...item.toJSON(),
          bidCount: item.Bids ? item.Bids.length : 0,
        };
      } catch (err) {
        throw new Error('Failed to fetch item: ' + err.message);
      }
    },

    // Get bids for an item ordered by amount DESC
    getBids: async (_, { itemId }) => {
      try {
        const bids = await Bid.findAll({
          where: { itemId },
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
          order: [['amount', 'DESC']],
        });
        return bids;
      } catch (err) {
        throw new Error('Failed to fetch bids: ' + err.message);
      }
    },

    // Get seller's items with bid counts
    getMyItems: async (_, { sellerId }) => {
      try {
        const items = await Item.findAll({
          where: { sellerId },
          include: [
            { model: Category, as: 'category' },
            { model: Bid, attributes: ['id'] },
          ],
          order: [['createdAt', 'DESC']],
        });

        return items.map((item) => ({
          ...item.toJSON(),
          bidCount: item.Bids ? item.Bids.length : 0,
        }));
      } catch (err) {
        throw new Error('Failed to fetch seller items: ' + err.message);
      }
    },

    // Get buyer's bids with item details
    getMyBids: async (_, { userId }) => {
      try {
        const bids = await Bid.findAll({
          where: { userId },
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: Category, as: 'category' },
                { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
        });
        return bids;
      } catch (err) {
        throw new Error('Failed to fetch user bids: ' + err.message);
      }
    },

    // Get all categories
    getCategories: async () => {
      try {
        return await Category.findAll({ order: [['id', 'ASC']] });
      } catch (err) {
        throw new Error('Failed to fetch categories: ' + err.message);
      }
    },
  },

  Mutation: {
    // Create a new auction item
    createItem: async (_, { title, description, image, startingPrice, endTime, categoryId, sellerId }) => {
      try {
        if (!title || !startingPrice || !endTime || !categoryId || !sellerId) {
          throw new Error('Missing required fields.');
        }

        const item = await Item.create({
          title,
          description,
          image,
          startingPrice,
          currentPrice: startingPrice,
          endTime: new Date(endTime),
          categoryId,
          sellerId,
          status: 'active',
        });

        return await Item.findByPk(item.id, {
          include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            { model: Category, as: 'category' },
          ],
        });
      } catch (err) {
        throw new Error('Failed to create item: ' + err.message);
      }
    },

    // Place a bid on an item
    placeBid: async (_, { itemId, userId, amount }) => {
      try {
        const item = await Item.findByPk(itemId);
        if (!item) throw new Error('Item not found.');
        if (item.status === 'closed') throw new Error('Auction is closed.');
        if (new Date(item.endTime) < new Date()) throw new Error('Auction has expired.');
        if (amount <= item.currentPrice) {
          throw new Error(`Bid must be greater than current price of $${item.currentPrice}.`);
        }

        const bid = await Bid.create({ amount, userId, itemId });
        await item.update({ currentPrice: amount });

        return await Bid.findByPk(bid.id, {
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] },
            { model: Item, as: 'item' },
          ],
        });
      } catch (err) {
        throw new Error('Failed to place bid: ' + err.message);
      }
    },

    // Close all expired auctions and set winners
    closeExpiredAuctions: async () => {
      try {
        const expiredItems = await Item.findAll({
          where: {
            status: 'active',
            endTime: { [Op.lt]: new Date() },
          },
          include: [{ model: Bid, attributes: ['id', 'userId', 'amount'] }],
        });

        for (const item of expiredItems) {
          let winnerId = null;

          if (item.Bids && item.Bids.length > 0) {
            const highestBid = item.Bids.reduce((max, b) => (b.amount > max.amount ? b : max), item.Bids[0]);
            winnerId = highestBid.userId;
          }

          await item.update({ status: 'closed', winnerId });
        }

        return true;
      } catch (err) {
        console.error('closeExpiredAuctions error:', err);
        return false;
      }
    },
  },
};

module.exports = resolvers;
