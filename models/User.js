const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Method เพื่อดึงข้อมูล Wallet ของ User
User.prototype.getWallets = function() {
  return this.hasMany(require("./Wallet"), {
    foreignKey: "user_id",
  });
};

// Method เพื่อดึงข้อมูล Order ของ User
User.prototype.getOrders = function() {
  return this.hasMany(require("./Order"), {
    foreignKey: "user_id",
  });
};

module.exports = User;
