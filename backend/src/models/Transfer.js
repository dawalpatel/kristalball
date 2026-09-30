const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transfer = sequelize.define('Transfer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  from_base_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bases',
      key: 'id'
    }
  },
  to_base_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bases',
      key: 'id'
    }
  },
  equipment_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'equipment_types',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  transfer_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'transfers',
  timestamps: true,
  underscored: true
});

module.exports = Transfer;
