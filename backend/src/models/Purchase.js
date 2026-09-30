const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  base_id: {
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
  purchase_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reference_number: {
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'purchases',
  timestamps: true,
  underscored: true
});

module.exports = Purchase;
