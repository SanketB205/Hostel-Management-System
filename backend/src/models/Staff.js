import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Staff = sequelize.define('Staff', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true, unique: true, field: 'user_id' },
  staffId: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'staff_id' },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: false },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false, field: 'date_of_birth' },
  email: { 
    type: DataTypes.STRING(255), 
    allowNull: false, 
    unique: true, 
    validate: { isEmail: true },
    set(value) {
      this.setDataValue('email', String(value).trim().toLowerCase());
    } 
  },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  designation: { type: DataTypes.STRING(100), allowNull: false },
  joiningDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'joining_date' },
  employmentType: { type: DataTypes.STRING(50), allowNull: false, field: 'employment_type' },
  assignedArea: { type: DataTypes.STRING(100), allowNull: false, field: 'assigned_area' },
  assignedBlock: { type: DataTypes.STRING(100), allowNull: true, field: 'assigned_block' },
  shift: { type: DataTypes.STRING(50), allowNull: false },
  emergencyContactName: { type: DataTypes.STRING(150), allowNull: false, field: 'emergency_contact_name' },
  relationship: { type: DataTypes.STRING(50), allowNull: false },
  emergencyPhone: { type: DataTypes.STRING(20), allowNull: false, field: 'emergency_phone' },
  uploadedFiles: { type: DataTypes.JSON, allowNull: true, field: 'uploaded_files' }
}, { tableName: 'staff' });
