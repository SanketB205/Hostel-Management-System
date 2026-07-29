import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.ENUM('admin', 'rector', 'student'), allowNull: false, defaultValue: 'student' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
}, {
  tableName: 'users',
  defaultScope: { attributes: { exclude: ['passwordHash'] } },
  scopes: { withPassword: { attributes: {} } },
});

User.prototype.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};
