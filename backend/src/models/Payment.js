import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  receiptNo: { type: DataTypes.STRING(50), allowNull: false, field: 'receipt_no' },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Payment amount' },
  paymentMode: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Cash', field: 'payment_mode' },
  status: { type: DataTypes.ENUM('Success', 'Failed', 'Pending'), allowNull: false, defaultValue: 'Success' },
  transactionId: { type: DataTypes.STRING(100), allowNull: true, field: 'transaction_id' },
  paymentDate: { type: DataTypes.DATE, allowNull: true, field: 'payment_date', comment: 'Date and time when payment was made' },
  notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Additional notes or remarks about the payment' },
  receivedBy: { type: DataTypes.STRING(100), allowNull: true, field: 'received_by', comment: 'Name of admin/staff who received the payment' },
}, { tableName: 'payments' });
