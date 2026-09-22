import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const RegistrationSequence = sequelize.define('RegistrationSequence', {
  year: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
    comment: '2-digit year representation e.g. 26 for 2026',
  },
  lastNumber: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'last_number',
    comment: 'Last issued registration sequence number for this year',
  },
}, {
  tableName: 'registration_sequences',
  timestamps: true,
});
