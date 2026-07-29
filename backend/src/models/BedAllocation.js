import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const BedAllocation = sequelize.define('BedAllocation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
  bedNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'bed_number' },
  allocatedAt: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW, field: 'allocated_at' },
  vacatedAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'vacated_at' },
  status: { type: DataTypes.ENUM('active', 'vacated'), allowNull: false, defaultValue: 'active' },
}, { tableName: 'bed_allocations' });
