import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const StudentAttendance = sequelize.define('StudentAttendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
  },
  attendanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'attendance_date',
  },
  status: {
    type: DataTypes.ENUM('Present', 'Absent', 'Outing', 'Leave', 'Late', 'Not Marked'),
    allowNull: false,
    defaultValue: 'Not Marked',
  },
}, {
  tableName: 'student_attendances',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'attendance_date'],
    },
  ],
});
