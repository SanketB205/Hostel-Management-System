import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Room = sequelize.define('Room', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  floorId: { type: DataTypes.UUID, allowNull: false, field: 'floor_id' },
  number: { type: DataTypes.STRING(30), allowNull: false, unique: true, set(value) { this.setDataValue('number', String(value).trim().toUpperCase()); } },
  type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Standard' },
  capacity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 20 } },
  status: { type: DataTypes.ENUM('Available', 'Occupied', 'Full', 'Maintenance'), allowNull: false, defaultValue: 'Available' },
  remarks: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'rooms' });
