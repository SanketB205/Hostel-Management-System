import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ComplaintTimeline = sequelize.define('ComplaintTimeline', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  complaintId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'complaint_id',
  },
  label: {
    // Human-readable event label e.g. "Complaint Submitted", "In Progress"
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  note: {
    // Optional extra detail for the event
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  actorId: {
    // User who triggered this event (nullable for system events)
    type: DataTypes.UUID,
    allowNull: true,
    field: 'actor_id',
  },
}, {
  tableName: 'complaint_timeline',
  // updatedAt is irrelevant here — each row is immutable
  updatedAt: false,
});
