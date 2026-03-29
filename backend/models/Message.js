const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  chatRoomId: { type: DataTypes.STRING, allowNull: false },
  senderId:   { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  receiverId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  message:    { type: DataTypes.TEXT, allowNull: false },
  isRead:     { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Message;
