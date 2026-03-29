const { Op } = require('sequelize');
const { User, Category, Item, Bid, Message, Notification } = require('../models');

const resolvers = {
  Query: {
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
        return items.map((item) => ({ ...item.toJSON(), bidCount: item.Bids ? item.Bids.length : 0 }));
      } catch (err) { throw new Error('Failed to fetch items: ' + err.message); }
    },

    getItem: async (_, { id }) => {
      try {
        const item = await Item.findByPk(id, {
          include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            { model: User, as: 'winner', attributes: ['id', 'name', 'email', 'role'] },
            { model: Category, as: 'category' },
            { model: Bid, include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }], order: [['amount', 'DESC']] },
          ],
        });
        if (!item) throw new Error('Item not found');
        return { ...item.toJSON(), bidCount: item.Bids ? item.Bids.length : 0 };
      } catch (err) { throw new Error('Failed to fetch item: ' + err.message); }
    },

    getBids: async (_, { itemId }) => {
      try {
        return await Bid.findAll({
          where: { itemId },
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
          order: [['amount', 'DESC']],
        });
      } catch (err) { throw new Error('Failed to fetch bids: ' + err.message); }
    },

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
        return items.map((item) => ({ ...item.toJSON(), bidCount: item.Bids ? item.Bids.length : 0 }));
      } catch (err) { throw new Error('Failed to fetch seller items: ' + err.message); }
    },

    getMyBids: async (_, { userId }) => {
      try {
        return await Bid.findAll({
          where: { userId },
          include: [{
            model: Item, as: 'item',
            include: [
              { model: Category, as: 'category' },
              { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            ],
          }],
          order: [['createdAt', 'DESC']],
        });
      } catch (err) { throw new Error('Failed to fetch user bids: ' + err.message); }
    },

    getCategories: async () => {
      try { return await Category.findAll({ order: [['id', 'ASC']] }); }
      catch (err) { throw new Error('Failed to fetch categories: ' + err.message); }
    },

    getChatRoom: async (_, { itemId }) => {
      try {
        const item = await Item.findByPk(itemId, {
          include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            { model: User, as: 'winner', attributes: ['id', 'name', 'email', 'role'] },
          ],
        });
        if (!item) throw new Error('Item not found');

        const chatRoomId = `auction_${itemId}`;
        const lastMessage = await Message.findOne({
          where: { chatRoomId },
          include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
          order: [['createdAt', 'DESC']],
        });

        return {
          chatRoomId,
          item: { ...item.toJSON(), bidCount: 0 },
          buyer:  item.winner || null,
          seller: item.seller || null,
          lastMessage: lastMessage || null,
          unreadCount: 0,
        };
      } catch (err) { throw new Error('Failed to get chat room: ' + err.message); }
    },

    getMessages: async (_, { chatRoomId }) => {
      try {
        return await Message.findAll({
          where: { chatRoomId },
          include: [
            { model: User, as: 'sender',   attributes: ['id', 'name', 'role'] },
            { model: User, as: 'receiver', attributes: ['id', 'name', 'role'] },
          ],
          order: [['createdAt', 'ASC']],
        });
      } catch (err) { throw new Error('Failed to fetch messages: ' + err.message); }
    },

    getNotifications: async (_, { userId }) => {
      try {
        return await Notification.findAll({
          where: { userId },
          include: [{ model: Item, as: 'item', required: false }],
          order: [['createdAt', 'DESC']],
          limit: 50,
        });
      } catch (err) { throw new Error('Failed to fetch notifications: ' + err.message); }
    },

    getUnreadCount: async (_, { userId }) => {
      try {
        return await Notification.count({ where: { userId, isRead: false } });
      } catch (err) { return 0; }
    },

    getMyChatRooms: async (_, { userId }) => {
      try {
        // Find closed items where user is seller or winner
        const items = await Item.findAll({
          where: {
            status: 'closed',
            [Op.or]: [{ sellerId: userId }, { winnerId: userId }],
          },
          include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            { model: User, as: 'winner', attributes: ['id', 'name', 'email', 'role'] },
          ],
        });

        const rooms = await Promise.all(
          items.map(async (item) => {
            const chatRoomId = `auction_${item.id}`;
            const lastMessage = await Message.findOne({
              where: { chatRoomId },
              include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
              order: [['createdAt', 'DESC']],
            });
            const unreadCount = await Message.count({
              where: { chatRoomId, receiverId: userId, isRead: false },
            });
            return {
              chatRoomId,
              item: { ...item.toJSON(), bidCount: 0 },
              buyer:  item.winner || null,
              seller: item.seller || null,
              lastMessage: lastMessage || null,
              unreadCount,
            };
          })
        );

        return rooms;
      } catch (err) { throw new Error('Failed to fetch chat rooms: ' + err.message); }
    },
  },

  Mutation: {
    createItem: async (_, { title, description, image, startingPrice, endTime, categoryId, sellerId }) => {
      try {
        if (!title || !startingPrice || !endTime || !categoryId || !sellerId) throw new Error('Missing required fields.');
        const item = await Item.create({ title, description, image, startingPrice, currentPrice: startingPrice, endTime: new Date(endTime), categoryId, sellerId, status: 'active' });
        return await Item.findByPk(item.id, {
          include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'role'] },
            { model: Category, as: 'category' },
          ],
        });
      } catch (err) { throw new Error('Failed to create item: ' + err.message); }
    },

    placeBid: async (_, { itemId, userId, amount }) => {
      try {
        const item = await Item.findByPk(itemId);
        if (!item) throw new Error('Item not found.');
        if (item.status === 'closed') throw new Error('Auction is closed.');
        if (new Date(item.endTime) < new Date()) throw new Error('Auction has expired.');
        if (amount <= item.currentPrice) throw new Error(`Bid must be greater than current price of ₹${item.currentPrice}.`);
        const bid = await Bid.create({ amount, userId, itemId });
        await item.update({ currentPrice: amount });
        return await Bid.findByPk(bid.id, {
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] },
            { model: Item, as: 'item' },
          ],
        });
      } catch (err) { throw new Error('Failed to place bid: ' + err.message); }
    },

    closeExpiredAuctions: async () => {
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
        }
        return true;
      } catch (err) { console.error('closeExpiredAuctions error:', err); return false; }
    },

    sendMessage: async (_, { chatRoomId, senderId, receiverId, message }) => {
      try {
        if (!message || !message.trim()) throw new Error('Message cannot be empty.');
        const msg = await Message.create({ chatRoomId, senderId, receiverId, message: message.trim() });
        return await Message.findByPk(msg.id, {
          include: [
            { model: User, as: 'sender',   attributes: ['id', 'name', 'role'] },
            { model: User, as: 'receiver', attributes: ['id', 'name', 'role'] },
          ],
        });
      } catch (err) { throw new Error('Failed to send message: ' + err.message); }
    },

    markMessagesRead: async (_, { chatRoomId, userId }) => {
      try {
        await Message.update({ isRead: true }, { where: { chatRoomId, receiverId: userId, isRead: false } });
        return true;
      } catch (err) { throw new Error('Failed to mark messages read: ' + err.message); }
    },

    markNotificationRead: async (_, { id }) => {
      try {
        await Notification.update({ isRead: true }, { where: { id } });
        return true;
      } catch (err) { throw new Error('Failed to mark notification read: ' + err.message); }
    },

    markAllNotificationsRead: async (_, { userId }) => {
      try {
        await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
        return true;
      } catch (err) { throw new Error('Failed to mark all read: ' + err.message); }
    },
  },
};

module.exports = resolvers;
