import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Floor = sequelize.define('Floor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  blockId: { type: DataTypes.UUID, allowNull: false, field: 'block_id' },
  floorNumber: { type: DataTypes.INTEGER, allowNull: false, field: 'floor_number', validate: { min: 0 } },
}, {
  tableName: 'floors',
  indexes: [{ unique: true, fields: ['block_id', 'floor_number'] }],
});
