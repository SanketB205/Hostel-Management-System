export { User } from './User.js';
export { HostelBlock } from './HostelBlock.js';
export { Floor } from './Floor.js';
export { Room } from './Room.js';
export { Student } from './Student.js';
export { BedAllocation } from './BedAllocation.js';
export { Staff } from './Staff.js';
export { Complaint } from './Complaint.js';
export { ComplaintTimeline } from './ComplaintTimeline.js';
export { StudentAttendance } from './StudentAttendance.js';
export { Payment } from './Payment.js';
export { Department } from './Department.js';
export { Course } from './Course.js';
export { RegistrationSequence } from './RegistrationSequence.js';

import { User } from './User.js';
import { HostelBlock } from './HostelBlock.js';
import { Floor } from './Floor.js';
import { Room } from './Room.js';
import { Student } from './Student.js';
import { BedAllocation } from './BedAllocation.js';
import { Staff } from './Staff.js';
import { Complaint } from './Complaint.js';
import { ComplaintTimeline } from './ComplaintTimeline.js';
import { StudentAttendance } from './StudentAttendance.js';
import { Payment } from './Payment.js';
import { Department } from './Department.js';
import { Course } from './Course.js';
import { RegistrationSequence } from './RegistrationSequence.js';

// Department & Course associations
Department.hasMany(Course, { foreignKey: 'departmentId', as: 'courses', onDelete: 'CASCADE' });
Course.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(Student, { foreignKey: 'departmentId', as: 'students' });
Student.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentDetails' });
Course.hasMany(Student, { foreignKey: 'courseId', as: 'students' });
Student.belongsTo(Course, { foreignKey: 'courseId', as: 'courseDetails' });

HostelBlock.hasMany(Floor, { foreignKey: 'blockId', as: 'floors', onDelete: 'CASCADE' });
Floor.belongsTo(HostelBlock, { foreignKey: 'blockId', as: 'block' });
Floor.hasMany(Room, { foreignKey: 'floorId', as: 'rooms', onDelete: 'CASCADE' });
Room.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });
User.hasOne(Student, { foreignKey: 'userId', as: 'student' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Student.hasMany(BedAllocation, { foreignKey: 'studentId', as: 'allocations' });
BedAllocation.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Room.hasMany(BedAllocation, { foreignKey: 'roomId', as: 'allocations' });
BedAllocation.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
User.hasOne(Staff, { foreignKey: 'userId', as: 'staff' });
Staff.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Complaint associations
Student.hasMany(Complaint, { foreignKey: 'studentId', as: 'complaints', onDelete: 'CASCADE' });
Complaint.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Staff.hasMany(Complaint, { foreignKey: 'assignedToId', as: 'assignedComplaints' });
Complaint.belongsTo(Staff, { foreignKey: 'assignedToId', as: 'assignedTo' });
Staff.hasMany(Complaint, { foreignKey: 'resolvedById', as: 'resolvedComplaints' });
Complaint.belongsTo(Staff, { foreignKey: 'resolvedById', as: 'resolvedBy' });
Complaint.hasMany(ComplaintTimeline, { foreignKey: 'complaintId', as: 'timeline', onDelete: 'CASCADE' });
ComplaintTimeline.belongsTo(Complaint, { foreignKey: 'complaintId', as: 'complaint' });

// Attendance associations
Student.hasMany(StudentAttendance, { foreignKey: 'studentId', as: 'attendances', onDelete: 'CASCADE' });
StudentAttendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Payment associations
Student.hasMany(Payment, { foreignKey: 'studentId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
