const jwt = require('jsonwebtoken');
const { Item, Bid, User } = require('../models');
require('dotenv').config();

// Map userId -> socketId for outbid notifications
const userSocketMap = new Map();

const initBidSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Register user<->socket mapping if token provided in handshake
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userSocketMap.set(String(decoded.id), socket.id);
        socket.userId = String(decoded.id);
      } catch (_) {
        // Invalid token — anonymous connection
      }
    }

    // Join a specific auction room
    socket.on('joinAuction', (itemId) => {
      socket.join(`auction_${itemId}`);
    });

    // Leave an auction room
    socket.on('leaveAuction', (itemId) => {
      socket.leave(`auction_${itemId}`);
    });

    // Handle real-time bid placement
    socket.on('placeBid', async ({ itemId, userId, amount, token: bidToken }) => {
      try {
        // Validate JWT
        if (!bidToken) {
          socket.emit('bidError', { message: 'Authentication required.' });
          return;
        }

        let decoded;
        try {
          decoded = jwt.verify(bidToken, process.env.JWT_SECRET);
        } catch (_) {
          socket.emit('bidError', { message: 'Invalid or expired token.' });
          return;
        }

        // Fetch item
        const item = await Item.findByPk(itemId, {
          include: [{ model: Bid, attributes: ['id', 'userId', 'amount'] }],
        });

        if (!item) {
          socket.emit('bidError', { message: 'Item not found.' });
          return;
        }

        if (item.status === 'closed') {
          socket.emit('bidError', { message: 'Auction is already closed.' });
          return;
        }

        if (new Date(item.endTime) < new Date()) {
          socket.emit('bidError', { message: 'Auction has expired.' });
          return;
        }

        if (Number(amount) <= item.currentPrice) {
          socket.emit('bidError', {
            message: `Bid must be greater than current price of $${item.currentPrice}.`,
          });
          return;
        }

        // Find previous highest bidder (for outbid alert)
        let previousHighestBidderId = null;
        if (item.Bids && item.Bids.length > 0) {
          const highestExisting = item.Bids.reduce(
            (max, b) => (b.amount > max.amount ? b : max),
            item.Bids[0]
          );
          if (String(highestExisting.userId) !== String(userId)) {
            previousHighestBidderId = String(highestExisting.userId);
          }
        }

        // Save bid to DB
        const bid = await Bid.create({ amount: Number(amount), userId, itemId });
        await item.update({ currentPrice: Number(amount) });

        // Fetch bidder name
        const bidder = await User.findByPk(userId, { attributes: ['id', 'name'] });

        // Count total bids
        const totalBids = await Bid.count({ where: { itemId } });

        // Broadcast updated bid to all in room
        io.to(`auction_${itemId}`).emit('bidUpdated', {
          newPrice: Number(amount),
          bidderName: bidder ? bidder.name : 'Unknown',
          bidderId: userId,
          itemId: itemId,
          bidCount: totalBids,
          timestamp: new Date(),
          bidId: bid.id,
        });

        // Notify previous highest bidder that they were outbid
        if (previousHighestBidderId) {
          const prevSocketId = userSocketMap.get(previousHighestBidderId);
          if (prevSocketId) {
            io.to(prevSocketId).emit('outbidAlert', {
              itemTitle: item.title,
              newAmount: Number(amount),
              itemId: itemId,
            });
          }
        }

        // Acknowledge to the bidder
        socket.emit('bidSuccess', { message: 'Bid placed successfully!', amount: Number(amount) });
      } catch (err) {
        console.error('Socket placeBid error:', err);
        socket.emit('bidError', { message: 'Server error while placing bid.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Clean up userSocketMap
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
      }
    });
  });
};

module.exports = initBidSocket;
