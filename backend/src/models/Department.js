import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    trim: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    trim: true,
    set(value) {
      this.setDataValue('code', String(value || '').trim().toUpperCase());
    },
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    allowNull: false,
    defaultValue: 'Active',
  },
}, {
  tableName: 'departments',
});
