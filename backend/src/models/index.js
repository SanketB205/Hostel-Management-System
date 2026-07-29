export { User } from './User.js';
export { HostelBlock } from './HostelBlock.js';
export { Floor } from './Floor.js';
export { Room } from './Room.js';
export { Student } from './Student.js';
export { BedAllocation } from './BedAllocation.js';
export { Staff } from './Staff.js';

import { User } from './User.js';
import { HostelBlock } from './HostelBlock.js';
import { Floor } from './Floor.js';
import { Room } from './Room.js';
import { Student } from './Student.js';
import { BedAllocation } from './BedAllocation.js';
import { Staff } from './Staff.js';

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
