import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Room = sequelize.define('Room', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  floorId: { type: DataTypes.UUID, allowNull: false, field: 'floor_id' },
  number: { type: DataTypes.STRING(30), allowNull: false, unique: true, set(value) { this.setDataValue('number', String(value).trim().toUpperCase()); } },
  type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Standard' },
  capacity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 20 } },
  status: { type: DataTypes.ENUM('Available', 'Occupied', 'Full', 'Maintenance'), allowNull: false, defaultValue: 'Available' },
  /**
   * Admin-controlled operational status.
   * - Available  → room is open for student allocations (effective status computed from bed count)
   * - Maintenance → room is under maintenance; no allocations permitted
   * - Reserved    → room is reserved; no allocations permitted
   * Occupied and Full are NEVER stored here — they are computed on the fly from bed allocations.
   */
  operationalStatus: {
    type: DataTypes.ENUM('Available', 'Maintenance', 'Reserved'),
    allowNull: false,
    defaultValue: 'Available',
    field: 'operational_status',
  },
  remarks: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'rooms' });
