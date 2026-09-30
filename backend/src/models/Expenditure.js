const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expenditure = sequelize.define('Expenditure', {
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
  expenditure_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
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
  tableName: 'expenditures',
  timestamps: true,
  underscored: true
});

module.exports = Expenditure;
