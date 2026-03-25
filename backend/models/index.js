const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Item = require('./Item');
const Bid = require('./Bid');

// User associations
User.hasMany(Item, { foreignKey: 'sellerId', as: 'sellerItems' });
User.hasMany(Bid, { foreignKey: 'userId' });

// Item associations
Item.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Item.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });
Item.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Item.hasMany(Bid, { foreignKey: 'itemId' });

// Bid associations
Bid.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Bid.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// Category associations
Category.hasMany(Item, { foreignKey: 'categoryId' });

module.exports = { sequelize, User, Category, Item, Bid };
