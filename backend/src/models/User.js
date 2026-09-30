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
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
    allowNull: false,
    defaultValue: 'LOGISTICS_OFFICER'
  },
  base_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bases',
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;
