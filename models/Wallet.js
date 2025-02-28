const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0
  }
}, {
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Wallet;
