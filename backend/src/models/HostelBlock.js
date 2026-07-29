import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const HostelBlock = sequelize.define('HostelBlock', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true, set(value) { this.setDataValue('name', String(value).trim().toUpperCase()); } },
}, { tableName: 'hostel_blocks' });
