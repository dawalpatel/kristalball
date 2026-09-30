const sequelize = require('../config/database');
const Base = require('./Base');
const User = require('./User');
const EquipmentType = require('./EquipmentType');
const Purchase = require('./Purchase');
const Transfer = require('./Transfer');
const Assignment = require('./Assignment');
const Expenditure = require('./Expenditure');
const AuditLog = require('./AuditLog');

// Define Associations

// User <-> Base
User.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });
Base.hasMany(User, { foreignKey: 'base_id', as: 'users' });

// Purchase <-> Base, EquipmentType, User
Purchase.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });
Base.hasMany(Purchase, { foreignKey: 'base_id', as: 'purchases' });

Purchase.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id', as: 'equipmentType' });
EquipmentType.hasMany(Purchase, { foreignKey: 'equipment_type_id', as: 'purchases' });

Purchase.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Purchase, { foreignKey: 'created_by', as: 'purchases' });

// Transfer <-> Base (From & To), EquipmentType, User
Transfer.belongsTo(Base, { foreignKey: 'from_base_id', as: 'fromBase' });
Base.hasMany(Transfer, { foreignKey: 'from_base_id', as: 'transfersOut' });

Transfer.belongsTo(Base, { foreignKey: 'to_base_id', as: 'toBase' });
Base.hasMany(Transfer, { foreignKey: 'to_base_id', as: 'transfersIn' });

Transfer.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id', as: 'equipmentType' });
EquipmentType.hasMany(Transfer, { foreignKey: 'equipment_type_id', as: 'transfers' });

Transfer.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Transfer, { foreignKey: 'created_by', as: 'transfers' });

// Assignment <-> Base, EquipmentType, User
Assignment.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });
Base.hasMany(Assignment, { foreignKey: 'base_id', as: 'assignments' });

Assignment.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id', as: 'equipmentType' });
EquipmentType.hasMany(Assignment, { foreignKey: 'equipment_type_id', as: 'assignments' });

Assignment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Assignment, { foreignKey: 'created_by', as: 'assignments' });

// Expenditure <-> Base, EquipmentType, User
Expenditure.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });
Base.hasMany(Expenditure, { foreignKey: 'base_id', as: 'expenditures' });

Expenditure.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id', as: 'equipmentType' });
EquipmentType.hasMany(Expenditure, { foreignKey: 'equipment_type_id', as: 'expenditures' });

Expenditure.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Expenditure, { foreignKey: 'created_by', as: 'expenditures' });

// AuditLog <-> User
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

module.exports = {
  sequelize,
  Base,
  User,
  EquipmentType,
  Purchase,
  Transfer,
  Assignment,
  Expenditure,
  AuditLog
};
