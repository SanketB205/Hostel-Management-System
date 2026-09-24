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
  departmentId: { type: DataTypes.UUID, allowNull: true, field: 'department_id' },
  courseId: { type: DataTypes.UUID, allowNull: true, field: 'course_id' },
  yearOfStudy: { type: DataTypes.STRING(50), allowNull: true, field: 'year_of_study' },
  admissionDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'admission_date' },
  guardianName: { type: DataTypes.STRING(150), allowNull: true, field: 'guardian_name' },
  guardianRelationship: { type: DataTypes.STRING(50), allowNull: true, field: 'guardian_relationship' },
  guardianPhone: { type: DataTypes.STRING(20), allowNull: true, field: 'guardian_phone' },
  guardianEmail: { type: DataTypes.STRING(255), allowNull: true, field: 'guardian_email' },
  status: { type: DataTypes.ENUM('Present', 'Absent', 'Outing', 'Leave', 'Late', 'Not Marked'), allowNull: false, defaultValue: 'Present' },
  totalBillable: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'total_billable', comment: 'Total hostel fee amount payable by the student' },
  totalFees: { type: DataTypes.INTEGER, allowNull: true, field: 'total_fees' },
  initialDeposit: { type: DataTypes.INTEGER, allowNull: true, field: 'initial_deposit' },
  paymentStatus: { type: DataTypes.ENUM('Paid', 'Partial', 'Pending'), allowNull: false, defaultValue: 'Pending', field: 'payment_status' },
}, { 
  tableName: 'students',
  getterMethods: {
    // Virtual field: Calculate total paid from successful payments
    totalPaid() {
      if (!this.payments || !Array.isArray(this.payments)) return 0;
      return this.payments
        .filter(p => p.status === 'Success')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    },
    // Virtual field: Calculate balance due
    balanceDue() {
      const billable = parseFloat(this.totalBillable || 0);
      const paid = this.totalPaid;
      return Math.max(0, billable - paid);
    },
    // Virtual field: Calculate payment status based on payments
    calculatedPaymentStatus() {
      const billable = parseFloat(this.totalBillable || 0);
      if (billable === 0) return 'Pending';
      
      const paid = this.totalPaid;
      const balance = this.balanceDue;
      
      if (paid === 0) return 'Pending';
      if (balance === 0) return 'Paid in Full';
      return 'Partial';
    }
  }
});
