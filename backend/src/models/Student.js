import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Student = sequelize.define('Student', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true, unique: true, field: 'user_id' },
  registrationNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'registration_number' },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false, field: 'date_of_birth' },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true }, set(value) { this.setDataValue('email', String(value).trim().toLowerCase()); } },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  department: { type: DataTypes.STRING(100), allowNull: true },
  course: { type: DataTypes.STRING(100), allowNull: false },
  year: { type: DataTypes.STRING(20), allowNull: false },
  admissionDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'admission_date' },
  guardianName: { type: DataTypes.STRING(150), allowNull: true, field: 'guardian_name' },
  guardianRelationship: { type: DataTypes.STRING(50), allowNull: true, field: 'guardian_relationship' },
  guardianPhone: { type: DataTypes.STRING(20), allowNull: true, field: 'guardian_phone' },
  guardianEmail: { type: DataTypes.STRING(255), allowNull: true, field: 'guardian_email' },
  status: { type: DataTypes.ENUM('Present', 'Absent', 'Outing', 'Leave', 'Late'), allowNull: false, defaultValue: 'Present' },
}, { tableName: 'students' });
