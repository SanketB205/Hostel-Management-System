import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'department_id',
    references: {
      model: 'departments',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    trim: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
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
  tableName: 'courses',
  indexes: [
    {
      unique: true,
      fields: ['department_id', 'code'],
    },
  ],
});
