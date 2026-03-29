const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:  { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'outbid', 'won', 'ending_soon', 'new_bid_on_listing',
      'battle_started', 'chat_message', 'snipe_executed', 'snipe_failed'
    ),
    allowNull: false,
  },
  title:   { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  itemId:  { type: DataTypes.INTEGER, allowNull: true },
  isRead:  { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Notification;
