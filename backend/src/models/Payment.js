import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  receiptNo: { type: DataTypes.STRING(50), allowNull: false, field: 'receipt_no' },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  paymentMode: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Razorpay', field: 'payment_mode' },
  status: { type: DataTypes.ENUM('Success', 'Failed', 'Pending'), allowNull: false, defaultValue: 'Pending' },
  transactionId: { type: DataTypes.STRING(100), allowNull: true, field: 'transaction_id' },
}, { tableName: 'payments' });
