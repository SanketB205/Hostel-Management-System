import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  complaintNumber: {
    // Human-readable ID e.g. CMP001 — generated in the controller
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'complaint_number',
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
  },
  category: {
    type: DataTypes.ENUM('Electrical', 'Plumbing', 'Carpentry', 'Internet', 'Cleaning', 'Other'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    allowNull: false,
    defaultValue: 'Low',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Resolved', 'Rejected'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  attachmentName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'attachment_name',
  },
  // Staff member who is handling / resolved this complaint
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to_id',
  },
  resolvedById: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'resolved_by_id',
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'resolution_notes',
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at',
  },
}, {
  tableName: 'complaints',
});
