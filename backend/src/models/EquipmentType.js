const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EquipmentType = sequelize.define('EquipmentType', {
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
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'equipment_types',
  timestamps: true,
  underscored: true
});

module.exports = EquipmentType;
