const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

class Order extends Model {}

Order.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  crypto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'THB'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'PENDING'
  }
}, {
  sequelize,
  modelName: 'Order',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// เพิ่มความสัมพันธ์กับ User
Order.belongsTo(User, {
  foreignKey: 'user_id'
});

module.exports = Order; 