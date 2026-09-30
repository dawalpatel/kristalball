const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Base = sequelize.define('Base', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'bases',
  timestamps: true,
  underscored: true
});

module.exports = Base;
