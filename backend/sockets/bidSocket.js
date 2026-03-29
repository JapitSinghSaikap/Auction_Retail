const jwt = require('jsonwebtoken');
const { Item, Bid, User, Message } = require('../models');
const { generateCommentary }       = require('../intelligence/commentary');
const { createNotification }       = require('../services/notificationService');
const { addActivity }              = require('../routes/activity');
require('dotenv').config();

// userId -> socketId map
const userSocketMap = new Map();

// BidBattle tracker: itemId -> { fighter1, fighter2, lastBidAt, lastUserId, battleCount, timer }
const battleTracker = {};

// Auto-snipe: `${itemId}_${userId}` -> timerId
const activeSnipes  = {};

const initBidSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Register userId -> socketId
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userSocketMap.set(String(decoded.id), socket.id);
        socket.userId = String(decoded.id);
      } catch (_) {}
    }

    /* ─── AUCTION ROOMS ─────────────────────────────────────── */
    socket.on('joinAuction',  (itemId) => socket.join(`auction_${itemId}`));
    socket.on('leaveAuction', (itemId) => socket.leave(`auction_${itemId}`));

    /* ─── GLOBAL ACTIVITY FEED ──────────────────────────────── */
    socket.on('joinGlobalFeed',  () => socket.join('global_feed'));
    socket.on('leaveGlobalFeed', () => socket.leave('global_feed'));

    /* ─── PERSONAL NOTIFICATIONS ────────────────────────────── */
    socket.on('joinNotifications', ({ userId }) => {
      socket.join(`notify_${userId}`);
    });

    /* ─── BID PLACEMENT ─────────────────────────────────────── */
    socket.on('placeBid', async ({ itemId, userId, amount, token: bidToken }) => {
      try {
        if (!bidToken) { socket.emit('bidError', { message: 'Authentication required.' }); return; }

        let decoded;
        try { decoded = jwt.verify(bidToken, process.env.JWT_SECRET); }
        catch (_) { socket.emit('bidError', { message: 'Invalid or expired token.' }); return; }

        const item = await Item.findByPk(itemId, {
          include: [{ model: Bid, attributes: ['id', 'userId', 'amount', 'createdAt'] }],
        });

        if (!item) { socket.emit('bidError', { message: 'Item not found.' }); return; }
        if (item.status === 'closed') { socket.emit('bidError', { message: 'Auction is already closed.' }); return; }
        if (new Date(item.endTime) < new Date()) { socket.emit('bidError', { message: 'Auction has expired.' }); return; }
        if (Number(amount) <= item.currentPrice) {
          socket.emit('bidError', { message: `Bid must exceed ₹${item.currentPrice}.` }); return;
        }

        // Previous highest bidder (for outbid)
        let previousHighestBidderId = null;
        if (item.Bids && item.Bids.length > 0) {
          const highest = item.Bids.reduce((max, b) => (b.amount > max.amount ? b : max), item.Bids[0]);
          if (String(highest.userId) !== String(userId)) previousHighestBidderId = String(highest.userId);
        }

        await Bid.create({ amount: Number(amount), userId, itemId });
        await item.update({ currentPrice: Number(amount) });

        const bidder    = await User.findByPk(userId, { attributes: ['id', 'name'] });
        const totalBids = await Bid.count({ where: { itemId } });

        const bidPayload = {
          newPrice:   Number(amount),
          bidderName: bidder?.name || 'Unknown',
          bidderId:   userId,
          itemId,
          bidCount:   totalBids,
          timestamp:  new Date(),
        };
        io.to(`auction_${itemId}`).emit('bidUpdated', bidPayload);
        socket.emit('bidSuccess', { message: 'Bid placed!', amount: Number(amount) });

        // ── OUTBID notification ──────────────────────────────
        if (previousHighestBidderId) {
          const prevSocketId = userSocketMap.get(previousHighestBidderId);
          if (prevSocketId) {
            io.to(prevSocketId).emit('outbidAlert', {
              itemTitle: item.title, newAmount: Number(amount), itemId,
            });
          }
          await createNotification(
            io, previousHighestBidderId, 'outbid',
            "You've been outbid!",
            `${bidder?.name || 'Someone'} bid ₹${Number(amount).toLocaleString('en-IN')} on "${item.title}"`,
            itemId
          );
        }

        // ── Seller notification for new bid ─────────────────
        if (String(item.sellerId) !== String(userId)) {
          await createNotification(
            io, item.sellerId, 'new_bid_on_listing',
            'New bid on your listing',
            `${bidder?.name || 'Someone'} bid ₹${Number(amount).toLocaleString('en-IN')} on "${item.title}"`,
            itemId
          );
        }

        // ── GLOBAL ACTIVITY FEED ─────────────────────────────
        const activityEvent = {
          type:      'bid',
          message:   `${bidder?.name || 'Someone'} bid ₹${Number(amount).toLocaleString('en-IN')} on ${item.title}`,
          itemId:    item.id,
          itemTitle: item.title,
          itemImage: item.image || null,
          amount:    Number(amount),
          userName:  bidder?.name || 'Unknown',
          timestamp: new Date().toISOString(),
          icon:      '💰',
        };
        addActivity(activityEvent);
        io.to('global_feed').emit('globalActivity', activityEvent);

        // ── BID BATTLE LOGIC ─────────────────────────────────
        const now = Date.now();
        const bt  = battleTracker[itemId] || {
          lastUserId: null, lastBidAt: 0,
          fighter1: null, fighter2: null,
          battleCount: 0, timer: null,
        };

        if (bt.lastUserId && String(bt.lastUserId) !== String(userId) && (now - bt.lastBidAt) < 30000) {
          bt.battleCount++;
          if (!bt.fighter1) bt.fighter1 = { id: bt.lastUserId, name: null };
          bt.fighter2 = { id: String(userId), name: bidder?.name || 'Unknown' };

          if (!bt.fighter1.name) {
            const f1 = await User.findByPk(bt.lastUserId, { attributes: ['id', 'name'] });
            if (f1) bt.fighter1.name = f1.name;
          }

          if (bt.battleCount >= 2) {
            io.to(`auction_${itemId}`).emit('bidBattleStarted', {
              itemId, fighter1: bt.fighter1, fighter2: bt.fighter2, currentPrice: Number(amount),
            });

            // Battle activity + notifications
            const battleEvent = {
              type: 'battle', message: `⚡ Bid Battle on "${item.title}"!`,
              itemId: item.id, itemTitle: item.title, icon: '⚡',
              timestamp: new Date().toISOString(),
            };
            addActivity(battleEvent);
            io.to('global_feed').emit('globalActivity', battleEvent);

            // Notify both fighters
            for (const fighterId of [bt.fighter1?.id, bt.fighter2?.id].filter(Boolean)) {
              await createNotification(
                io, fighterId, 'battle_started',
                '⚡ Bid Battle Started!',
                `You're in a battle on "${item.title}"!`,
                itemId
              );
            }
          }
        }

        if (bt.timer) clearTimeout(bt.timer);
        bt.timer = setTimeout(() => {
          io.to(`auction_${itemId}`).emit('bidBattleEnded', {
            itemId,
            winner: { id: bt.lastUserId, name: bt.fighter2?.name || bt.fighter1?.name },
            finalPrice: Number(amount),
          });
          delete battleTracker[itemId];
        }, 30000);

        bt.lastUserId = String(userId);
        bt.lastBidAt  = now;
        battleTracker[itemId] = bt;

        // ── COMMENTARY ───────────────────────────────────────
        const freshBids  = await Bid.findAll({ where: { itemId }, order: [['amount', 'DESC']], limit: 10 });
        const bidsPlain  = freshBids.map((b) => b.toJSON());
        const isBattle   = bt.battleCount >= 2;
        const commentary = generateCommentary({ amount, bidderName: bidder?.name }, item.toJSON(), bidsPlain, isBattle);
        io.to(`auction_${itemId}`).emit('commentary', commentary);

      } catch (err) {
        console.error('Socket placeBid error:', err);
        socket.emit('bidError', { message: 'Server error while placing bid.' });
      }
    });

    /* ─── EMOJI REACTIONS ───────────────────────────────────── */
    socket.on('sendReaction', async ({ itemId, emoji, userId }) => {
      try {
        let userName = 'Someone';
        if (userId) {
          const user = await User.findByPk(userId, { attributes: ['id', 'name'] });
          if (user) userName = user.name;
        }
        io.to(`auction_${itemId}`).emit('newReaction', { emoji, userName, timestamp: Date.now() });
      } catch (err) { console.error('sendReaction error:', err); }
    });

    /* ─── AUTO SNIPE ────────────────────────────────────────── */
    socket.on('setAutoSnipe', async ({ itemId, userId, maxBudget, increment, snipeSeconds, token: snipeToken }) => {
      try {
        if (!snipeToken) { socket.emit('snipeFailed', { reason: 'Authentication required.' }); return; }
        try { jwt.verify(snipeToken, process.env.JWT_SECRET); }
        catch (_) { socket.emit('snipeFailed', { reason: 'Invalid token.' }); return; }

        const item = await Item.findByPk(itemId);
        if (!item) { socket.emit('snipeFailed', { reason: 'Item not found.' }); return; }
        if (item.status !== 'active') { socket.emit('snipeFailed', { reason: 'Auction is not active.' }); return; }

        const endTime = new Date(item.endTime).getTime();
        const delay   = Math.max(0, endTime - Date.now() - (snipeSeconds || 30) * 1000);
        const key     = `${itemId}_${userId}`;
        if (activeSnipes[key]) clearTimeout(activeSnipes[key]);

        const scheduledFor = new Date(Date.now() + delay).toISOString();

        const timerId = setTimeout(async () => {
          try {
            const freshItem = await Item.findByPk(itemId);
            if (!freshItem || freshItem.status !== 'active') {
              socket.emit('snipeFailed', { reason: 'Auction ended before snipe could fire.', itemId });
              return;
            }
            if (freshItem.currentPrice >= maxBudget) {
              await createNotification(io, userId, 'snipe_failed', '❌ Snipe Failed',
                `Budget exceeded on "${freshItem.title}"`, itemId);
              socket.emit('snipeFailed', { reason: `Price ₹${freshItem.currentPrice} exceeds budget.`, itemId });
              return;
            }

            const bidAmount = Math.min(freshItem.currentPrice + (increment || 10), maxBudget);
            await Bid.create({ amount: bidAmount, userId, itemId });
            await freshItem.update({ currentPrice: bidAmount });

            const bidder    = await User.findByPk(userId, { attributes: ['id', 'name'] });
            const totalBids = await Bid.count({ where: { itemId } });

            io.to(`auction_${itemId}`).emit('bidUpdated', {
              newPrice: bidAmount, bidderName: bidder?.name || 'AutoSniper',
              bidderId: userId, itemId, bidCount: totalBids,
              timestamp: new Date(), isAutoSnipe: true,
            });

            // Activity feed
            const snipeEvent = {
              type: 'bid', message: `🎯 ${bidder?.name || 'AutoSniper'} sniped "${freshItem.title}" at ₹${bidAmount.toLocaleString('en-IN')}`,
              itemId: freshItem.id, itemTitle: freshItem.title,
              amount: bidAmount, icon: '🎯', timestamp: new Date().toISOString(),
            };
            addActivity(snipeEvent);
            io.to('global_feed').emit('globalActivity', snipeEvent);

            await createNotification(io, userId, 'snipe_executed', '🎯 Auto-Snipe Placed!',
              `Bid ₹${bidAmount.toLocaleString('en-IN')} on "${freshItem.title}"`, itemId);

            socket.emit('snipeExecuted', { bidAmount, itemId });
            delete activeSnipes[key];
          } catch (err) {
            socket.emit('snipeFailed', { reason: err.message, itemId });
          }
        }, delay);

        activeSnipes[key] = timerId;
        socket.emit('snipeScheduled', {
          scheduledFor, maxBudget,
          message: `Auto-snipe set — fires ${snipeSeconds}s before auction ends`,
        });
      } catch (err) {
        console.error('setAutoSnipe error:', err);
        socket.emit('snipeFailed', { reason: err.message });
      }
    });

    socket.on('cancelSnipe', ({ itemId, userId }) => {
      const key = `${itemId}_${userId}`;
      if (activeSnipes[key]) { clearTimeout(activeSnipes[key]); delete activeSnipes[key]; }
      socket.emit('snipeCancelled', { itemId });
    });

    /* ─── CHAT ──────────────────────────────────────────────── */
    socket.on('joinChatRoom', async ({ chatRoomId, userId }) => {
      try {
        const itemId = chatRoomId.replace('auction_', '');
        const item   = await Item.findByPk(itemId);
        if (!item) return;
        if (String(item.sellerId) === String(userId) || String(item.winnerId) === String(userId)) {
          socket.join(`chat_${chatRoomId}`);
        }
      } catch (_) {}
    });

    socket.on('sendChatMessage', async ({ chatRoomId, senderId, receiverId, message, token: chatToken }) => {
      try {
        if (!chatToken) { socket.emit('chatError', { message: 'Authentication required.' }); return; }
        try { jwt.verify(chatToken, process.env.JWT_SECRET); }
        catch (_) { socket.emit('chatError', { message: 'Invalid token.' }); return; }
        if (!message?.trim()) return;

        const msg  = await Message.create({ chatRoomId, senderId, receiverId, message: message.trim() });
        const sender = await User.findByPk(senderId, { attributes: ['id', 'name'] });

        io.to(`chat_${chatRoomId}`).emit('newChatMessage', {
          id: msg.id, message: msg.message,
          sender: sender, chatRoomId, createdAt: msg.createdAt,
        });

        // Notification for receiver
        await createNotification(
          io, receiverId, 'chat_message',
          'New message',
          `${sender?.name || 'Someone'}: ${message.trim().slice(0, 60)}`,
          chatRoomId.replace('auction_', '') || null
        );
      } catch (err) {
        console.error('sendChatMessage error:', err);
        socket.emit('chatError', { message: 'Failed to send message.' });
      }
    });

    socket.on('chatTyping',     ({ chatRoomId, userName }) => {
      socket.to(`chat_${chatRoomId}`).emit('userTyping',     { userName, chatRoomId });
    });
    socket.on('chatStopTyping', ({ chatRoomId }) => {
      socket.to(`chat_${chatRoomId}`).emit('userStopTyping', { chatRoomId });
    });

    /* ─── DISCONNECT ────────────────────────────────────────── */
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (socket.userId) userSocketMap.delete(socket.userId);
    });
  });
};

module.exports = initBidSocket;
