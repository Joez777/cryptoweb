const User = require('./User');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const Order = require('./Order');
const sequelize = require('../config/database');

// กำหนดความสัมพันธ์ระหว่างโมเดล
User.hasMany(Wallet, { foreignKey: 'user_id', as: 'wallets' });
Wallet.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Wallet.hasMany(Transaction, { foreignKey: 'wallet_id', as: 'transactions' });
Transaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });

module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  Order
}; 