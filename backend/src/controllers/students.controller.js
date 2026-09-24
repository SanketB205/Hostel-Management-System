import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { BedAllocation, Room, Student, User, StudentAttendance, Floor, HostelBlock, Payment, Department, Course, RegistrationSequence } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

const VALID_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

// Converts any date string (YYYY-MM-DD or ISO) → DDMMYYYY password
const dobPassword = (dateOfBirth) => {
  // Slice first 10 chars handles both "2005-02-20" and "2005-02-20T00:00:00.000Z"
  const dateStr = String(dateOfBirth).slice(0, 10);
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr; // fallback — won't match but avoids crash
  return `${day}${month}${year}`;
};

// ── List all students ─────────────────────────────────────────────────────────

export const listStudents = asyncHandler(async (req, res) => {
  const students = await Student.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['role'],
        where: { role: 'student' }
      },
      {
        model: BedAllocation,
        as: 'allocations',
        where: { status: 'active' },
        required: false,
        include: [{ model: Room, as: 'room' }],
      },
      { model: Department, as: 'departmentDetails', required: false },
      { model: Course, as: 'courseDetails', required: false },
    ],
    order: [['registrationNumber', 'ASC']],
  });

  // Use req.query.date if provided, otherwise default to today
  const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
  const attendances = await StudentAttendance.findAll({
    where: { attendanceDate: targetDate },
  });

  const attendanceMap = {};
  attendances.forEach((a) => {
    attendanceMap[a.studentId] = a.status;
  });

  const data = students.map((s) => {
    const sJson = s.toJSON();
    sJson.status = attendanceMap[s.id] || 'Not Marked';
    return sJson;
  });

  res.json({ data });
});

// ── Get single student ────────────────────────────────────────────────────────

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, {
    include: [
      {
        model: BedAllocation,
        as: 'allocations',
        required: false,
        include: [{
          model: Room,
          as: 'room',
          include: [{
            model: Floor,
            as: 'floor',
            include: [{
              model: HostelBlock,
              as: 'block'
            }]
          }]
        }],
        order: [['allocatedAt', 'DESC']],
      },
      {
        model: Payment,
        as: 'payments',
        required: false,
      },
      { model: Department, as: 'departmentDetails', required: false },
      { model: Course, as: 'courseDetails', required: false },
    ],
  });
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const today = new Date().toISOString().slice(0, 10);
  const attendance = await StudentAttendance.findOne({
    where: { studentId: student.id, attendanceDate: today },
  });

  const studentJson = student.toJSON();
  studentJson.attendanceStatus = attendance ? attendance.status : 'Not Marked';
  studentJson.status = attendance ? attendance.status : (student.status || 'Present');

  res.json({ data: studentJson });
});

// Helper: resolve and validate departmentId/courseId/yearOfStudy from body
async function resolveAcademicFields(body) {
  const { departmentId, courseId, yearOfStudy } = body;
  const resolved = {};

  if (departmentId) {
    const dept = await Department.findByPk(departmentId);
    if (!dept) throw Object.assign(new Error('Selected department not found.'), { status: 400 });
    resolved.departmentId = dept.id;
    resolved.department = dept.name; // keep legacy string
  }

  if (courseId) {
    const course = await Course.findByPk(courseId);
    if (!course) throw Object.assign(new Error('Selected course not found.'), { status: 400 });
    if (departmentId && course.departmentId !== departmentId) {
      throw Object.assign(new Error('Selected course does not belong to the selected department.'), { status: 400 });
    }
    resolved.courseId = course.id;
    resolved.course = course.name; // keep legacy string
  }

  if (yearOfStudy) {
    if (!VALID_YEARS.includes(yearOfStudy)) {
      throw Object.assign(new Error(`Year of study must be one of: ${VALID_YEARS.join(', ')}.`), { status: 400 });
    }
    resolved.yearOfStudy = yearOfStudy;
    resolved.year = yearOfStudy; // keep legacy string
  }

  return resolved;
}

// ── Registration Number Sequence Helpers ─────────────────────────────────────

// Helper: atomically generate next student registration number (HS-YY-NNN)
export async function generateNextRegistrationNumber(transaction) {
  const year = String(new Date().getFullYear()).slice(-2);

  let sequence = await RegistrationSequence.findOne({
    where: { year },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!sequence) {
    // Check if any existing student has HS-YY-NNN format to seed starting counter
    const existing = await Student.findAll({
      where: {
        registrationNumber: {
          [Op.like]: `HS-${year}-%`,
        },
      },
      attributes: ['registrationNumber'],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    let maxNum = 0;
    for (const s of existing) {
      const parts = String(s.registrationNumber || '').split('-');
      if (parts.length === 3 && parts[0] === 'HS' && parts[1] === year) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    sequence = await RegistrationSequence.create({
      year,
      lastNumber: maxNum,
    }, { transaction });
  }

  const nextNumber = sequence.lastNumber + 1;
  await sequence.update({ lastNumber: nextNumber }, { transaction });

  return `HS-${year}-${String(nextNumber).padStart(3, '0')}`;
}

// Handler: preview next registration number without incrementing counter
export const getNextRegistrationNumberPreview = asyncHandler(async (req, res) => {
  const year = String(new Date().getFullYear()).slice(-2);
  const sequence = await RegistrationSequence.findByPk(year);

  let nextNumber = 1;
  if (sequence) {
    nextNumber = sequence.lastNumber + 1;
  } else {
    const existing = await Student.findAll({
      where: {
        registrationNumber: {
          [Op.like]: `HS-${year}-%`,
        },
      },
      attributes: ['registrationNumber'],
    });
    let maxNum = 0;
    for (const s of existing) {
      const parts = String(s.registrationNumber || '').split('-');
      if (parts.length === 3 && parts[0] === 'HS' && parts[1] === year) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    nextNumber = maxNum + 1;
  }

  const registrationNumber = `HS-${year}-${String(nextNumber).padStart(3, '0')}`;
  res.json({ registrationNumber });
});

// ── Create student ────────────────────────────────────────────────────────────

export const createStudent = asyncHandler(async (req, res) => {
  const { firstName, lastName, dateOfBirth, email, course, year, totalBillable } = req.body;
  if (!firstName || !lastName || !dateOfBirth || !email || !course || !year) {
    return res.status(400).json({ message: 'Name, date of birth, email, course, and year are required.' });
  }

  // Validate totalBillable if provided
  if (totalBillable !== undefined && totalBillable !== null && totalBillable !== '') {
    const billable = parseFloat(totalBillable);
    if (isNaN(billable) || billable < 0) {
      return res.status(400).json({ message: 'Total billable must be a valid non-negative amount.' });
    }
  }

  // Validate payments if provided
  const payments = req.body.payments || [];
  if (payments.length > 0) {
    for (const payment of payments) {
      if (!payment.amount || parseFloat(payment.amount) <= 0) {
        return res.status(400).json({ message: 'Each payment must have a valid positive amount.' });
      }
      if (!payment.paymentMode) {
        return res.status(400).json({ message: 'Each payment must have a payment mode.' });
      }
    }
  }

  const academicFields = await resolveAcademicFields(req.body);

  const result = await sequelize.transaction(async (transaction) => {
    // Atomically generate sequential registration number for current year
    const registrationNumber = await generateNextRegistrationNumber(transaction);

    // Password is always DDMMYYYY derived from date of birth — no overrides
    const user = await User.create({
      email,
      passwordHash: await bcrypt.hash(dobPassword(dateOfBirth), 12),
      role: 'student',
    }, { transaction });

    const student = await Student.create({
      ...req.body,
      ...academicFields,
      registrationNumber,
      userId: user.id,
    }, { transaction });

    // Create initial payments if provided
    if (payments.length > 0) {
      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        await Payment.create({
          studentId: student.id,
          receiptNo: `${registrationNumber}-${Date.now()}-${i + 1}`, // Generate unique receipt number
          amount: parseFloat(payment.amount),
          paymentMode: payment.paymentMode || 'Cash',
          status: 'Success', // Initial payments are marked as successful
          transactionId: payment.transactionId || payment.reference || null,
          paymentDate: payment.paymentDate || payment.date || new Date(),
          notes: payment.notes || null,
          receivedBy: payment.receivedBy || 'Admin',
        }, { transaction });
      }
    }

    const allocationData = req.body.allocation;
    if (!allocationData) {
      // Fetch student with payments for response
      const studentWithPayments = await Student.findByPk(student.id, {
        include: [{ model: Payment, as: 'payments' }],
        transaction
      });
      return studentWithPayments;
    }

    const roomNumber = String(allocationData.roomNumber || '').trim().toUpperCase();
    const room = await Room.findOne({ where: { number: roomNumber }, transaction, lock: transaction.LOCK.UPDATE });
    if (!room) throw Object.assign(new Error('Selected room was not found in the database.'), { status: 404 });
    if (room.status === 'Maintenance') throw Object.assign(new Error('Maintenance rooms cannot receive allocations.'), { status: 409 });

    const occupiedBeds = await BedAllocation.count({ where: { roomId: room.id, status: 'active' }, transaction });
    if (occupiedBeds >= room.capacity) throw Object.assign(new Error('Selected room is already full.'), { status: 409 });

    const occupiedBed = await BedAllocation.findOne({
      where: { roomId: room.id, bedNumber: allocationData.bedNumber, status: 'active' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (occupiedBed) throw Object.assign(new Error('Selected bed is already allocated.'), { status: 409 });

    await BedAllocation.create({
      studentId: student.id,
      roomId: room.id,
      bedNumber: allocationData.bedNumber,
      allocatedAt: allocationData.allocatedAt || new Date(),
    }, { transaction });

    await room.update({
      status: occupiedBeds + 1 >= room.capacity ? 'Full' : 'Occupied',
    }, { transaction });

    // Fetch student with payments for response
    const studentWithPayments = await Student.findByPk(student.id, {
      include: [{ model: Payment, as: 'payments' }],
      transaction
    });
    return studentWithPayments;
  });

  res.status(201).json({ data: result });
});

// ── Update student status (rector attendance) ─────────────────────────────────

export const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Present', 'Absent', 'Outing', 'Leave', 'Late', 'Not Marked'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}.` });
  }

  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const today = new Date().toISOString().slice(0, 10);

  const [attendance, created] = await StudentAttendance.findOrCreate({
    where: {
      studentId: student.id,
      attendanceDate: today,
    },
    defaults: {
      studentId: student.id,
      attendanceDate: today,
      status,
    },
  });

  if (!created) {
    await attendance.update({ status });
  }

  if (status !== 'Not Marked') {
    await student.update({ status });
  }

  res.json({ data: { id: student.id, status } });
});

export const resetStudentPassword = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const user = await User.scope('withPassword').findByPk(student.userId);
  if (!user) return res.status(404).json({ message: 'No login account linked to this student.' });

  // Always recompute from stored dateOfBirth (YYYY-MM-DD → DDMMYYYY)
  user.passwordHash = await bcrypt.hash(dobPassword(student.dateOfBirth), 12);
  await user.save();

  res.json({
    message: `Password reset to DOB format (DDMMYYYY) for ${student.firstName} ${student.lastName}.`,
  });
});

export const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
  const range = req.query.range || 'Today';

  const getPastDates = (endDateStr, daysCount) => {
    const dates = [];
    const endDate = new Date(endDateStr);
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };

  let datesInRange = [targetDate];
  if (range === '7D') {
    datesInRange = getPastDates(targetDate, 7);
  } else if (range === '30D') {
    datesInRange = getPastDates(targetDate, 30);
  }

  // 1. Fetch all students with active allocations
  const students = await Student.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['role'],
        where: { role: 'student' }
      },
      {
        model: BedAllocation,
        as: 'allocations',
        where: { status: 'active' },
        required: false,
        include: [{
          model: Room,
          as: 'room',
          include: [{
            model: Floor,
            as: 'floor',
            include: [{
              model: HostelBlock,
              as: 'block'
            }]
          }]
        }]
      }
    ]
  });

  // 2. Fetch all attendance in datesInRange
  const targetAttendances = await StudentAttendance.findAll({
    where: {
      attendanceDate: { [Op.in]: datesInRange }
    }
  });

  const attendanceKeyMap = {};
  targetAttendances.forEach(a => {
    attendanceKeyMap[`${a.studentId}_${a.attendanceDate}`] = a.status;
  });

  // 3. Stats aggregated for datesInRange
  let present = 0, absent = 0, leave = 0, outing = 0, late = 0, pending = 0;
  students.forEach(s => {
    datesInRange.forEach(date => {
      const status = attendanceKeyMap[`${s.id}_${date}`] || 'Not Marked';
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Leave') leave++;
      else if (status === 'Outing') outing++;
      else if (status === 'Late') late++;
      else pending++;
    });
  });

  const total = students.length;
  const totalSlots = total * datesInRange.length;
  const rate = totalSlots > 0 ? Math.round(((present + late + outing) / totalSlots) * 100) : 0;

  // 4. Course-wise Attendance
  const courseMap = {};
  students.forEach(s => {
    const course = s.course || 'Unknown';
    if (!courseMap[course]) {
      courseMap[course] = { total: 0, present: 0, absent: 0 };
    }
    datesInRange.forEach(date => {
      courseMap[course].total++;
      const status = attendanceKeyMap[`${s.id}_${date}`] || 'Not Marked';
      if (['Present', 'Late', 'Outing'].includes(status)) {
        courseMap[course].present++;
      } else if (status === 'Absent') {
        courseMap[course].absent++;
      }
    });
  });
  const courseAttendance = Object.entries(courseMap).map(([course, counts]) => ({
    course,
    present: counts.present,
    absent: counts.absent,
    rate: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0
  }));

  // 5. Year-wise Attendance
  const yearMap = {};
  students.forEach(s => {
    const year = s.year || 'Unknown';
    if (!yearMap[year]) {
      yearMap[year] = { total: 0, present: 0, absent: 0 };
    }
    datesInRange.forEach(date => {
      yearMap[year].total++;
      const status = attendanceKeyMap[`${s.id}_${date}`] || 'Not Marked';
      if (['Present', 'Late', 'Outing'].includes(status)) {
        yearMap[year].present++;
      } else if (status === 'Absent') {
        yearMap[year].absent++;
      }
    });
  });
  const yearAttendance = Object.entries(yearMap).map(([year, counts]) => ({
    year,
    present: counts.present,
    absent: counts.absent,
    rate: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0
  }));

  // 6. Block-wise Attendance
  const blockMap = {};
  students.forEach(s => {
    const block = s.allocations?.[0]?.room?.floor?.block?.name || 'Unassigned';
    if (!blockMap[block]) {
      blockMap[block] = { total: 0, present: 0, absent: 0 };
    }
    datesInRange.forEach(date => {
      blockMap[block].total++;
      const status = attendanceKeyMap[`${s.id}_${date}`] || 'Not Marked';
      if (['Present', 'Late', 'Outing'].includes(status)) {
        blockMap[block].present++;
      } else if (status === 'Absent') {
        blockMap[block].absent++;
      }
    });
  });
  const blockAttendance = Object.entries(blockMap).map(([block, counts]) => ({
    block,
    present: counts.present,
    absent: counts.absent,
    rate: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0
  }));

  // 7. Last 7 Days dates
  const past7Days = getPastDates(targetDate, 7);
  const weeklyAttendances = await StudentAttendance.findAll({
    where: {
      attendanceDate: { [Op.in]: past7Days }
    }
  });

  const dailyStatsMap = {};
  past7Days.forEach(date => {
    dailyStatsMap[date] = { Present: 0, Absent: 0, Leave: 0, total: 0 };
  });

  weeklyAttendances.forEach(a => {
    if (dailyStatsMap[a.attendanceDate]) {
      dailyStatsMap[a.attendanceDate].total++;
      if (['Present', 'Late', 'Outing'].includes(a.status)) {
        dailyStatsMap[a.attendanceDate].Present++;
      } else if (a.status === 'Absent') {
        dailyStatsMap[a.attendanceDate].Absent++;
      } else if (a.status === 'Leave') {
        dailyStatsMap[a.attendanceDate].Leave++;
      }
    }
  });

  const weeklyTrend7D = past7Days.map(date => {
    const dayData = dailyStatsMap[date];
    const totalDay = dayData.total;
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    
    return {
      name: dayName,
      Present: totalDay > 0 ? Math.round((dayData.Present / totalDay) * 100) : 0,
      Absent: totalDay > 0 ? Math.round((dayData.Absent / totalDay) * 100) : 0,
      Leave: totalDay > 0 ? Math.round((dayData.Leave / totalDay) * 100) : 0
    };
  });

  // Today trend check-in progress (based on actual attendance status marked at/before slot hour for targetDay)
  const targetDayAttendances = targetAttendances.filter(a => a.attendanceDate === targetDate);
  const todaySlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const weeklyTrendToday = todaySlots.map(slot => {
    const slotHour = parseInt(slot.split(':')[0], 10);
    let slotPresent = 0;
    let slotAbsent = 0;
    let slotLeave = 0;
    let slotTotal = 0;

    targetDayAttendances.forEach(a => {
      const recordDate = new Date(a.createdAt || a.updatedAt);
      const recordHour = recordDate.getHours();
      
      if (recordHour <= slotHour) {
        slotTotal++;
        if (['Present', 'Late', 'Outing'].includes(a.status)) {
          slotPresent++;
        } else if (a.status === 'Absent') {
          slotAbsent++;
        } else if (a.status === 'Leave') {
          slotLeave++;
        }
      }
    });

    const totalDenom = slotTotal > 0 ? slotTotal : 1;
    
    return {
      name: slot,
      Present: slotTotal > 0 ? Math.round((slotPresent / totalDenom) * 100) : 0,
      Absent: slotTotal > 0 ? Math.round((slotAbsent / totalDenom) * 100) : 0,
      Leave: slotTotal > 0 ? Math.round((slotLeave / totalDenom) * 100) : 0
    };
  });

  // 30 Days trend (last 4 weeks)
  const past30Days = getPastDates(targetDate, 28);
  const attendances30D = await StudentAttendance.findAll({
    where: {
      attendanceDate: { [Op.in]: past30Days }
    }
  });

  const weekStats = [
    { name: 'W1', Present: 0, Absent: 0, Leave: 0, total: 0 },
    { name: 'W2', Present: 0, Absent: 0, Leave: 0, total: 0 },
    { name: 'W3', Present: 0, Absent: 0, Leave: 0, total: 0 },
    { name: 'W4', Present: 0, Absent: 0, Leave: 0, total: 0 }
  ];

  attendances30D.forEach(a => {
    const dayIdx = past30Days.indexOf(a.attendanceDate);
    if (dayIdx >= 0) {
      const weekIdx = Math.floor(dayIdx / 7);
      if (weekIdx >= 0 && weekIdx < 4) {
        weekStats[weekIdx].total++;
        if (['Present', 'Late', 'Outing'].includes(a.status)) {
          weekStats[weekIdx].Present++;
        } else if (a.status === 'Absent') {
          weekStats[weekIdx].Absent++;
        } else if (a.status === 'Leave') {
          weekStats[weekIdx].Leave++;
        }
      }
    }
  });

  const weeklyTrend30D = weekStats.map(w => {
    const totalW = w.total;
    return {
      name: w.name,
      Present: totalW > 0 ? Math.round((w.Present / totalW) * 100) : 0,
      Absent: totalW > 0 ? Math.round((w.Absent / totalW) * 100) : 0,
      Leave: totalW > 0 ? Math.round((w.Leave / totalW) * 100) : 0
    };
  });

  // 8. Students requiring attention (rates < 75%)
  const allHistory = await StudentAttendance.findAll();
  const studentHistoryMap = {};
  allHistory.forEach(a => {
    if (!studentHistoryMap[a.studentId]) {
      studentHistoryMap[a.studentId] = { total: 0, present: 0 };
    }
    studentHistoryMap[a.studentId].total++;
    if (['Present', 'Late', 'Outing'].includes(a.status)) {
      studentHistoryMap[a.studentId].present++;
    }
  });

  const attentionStudents = [];
  students.forEach(s => {
    const history = studentHistoryMap[s.id];
    if (history && history.total > 2) {
      const rateVal = Math.round((history.present / history.total) * 100);
      if (rateVal < 75) {
        attentionStudents.push({
          name: `${s.firstName} ${s.lastName}`,
          issue: 'Attendance Below 75%',
          rate: rateVal
        });
      }
    }
  });

  // 9. Monthly rates for this year
  const targetYear = new Date(targetDate).getFullYear();
  const monthlyRates = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let m = 0; m < 12; m++) {
    const monthStr = String(m + 1).padStart(2, '0');
    const monthAttendances = allHistory.filter(a => 
      a.attendanceDate.startsWith(`${targetYear}-${monthStr}`)
    );
    
    if (monthAttendances.length > 0) {
      let mPresent = 0;
      monthAttendances.forEach(a => {
        if (['Present', 'Late', 'Outing'].includes(a.status)) mPresent++;
      });
      monthlyRates.push({
        name: monthNames[m],
        rate: Math.round((mPresent / monthAttendances.length) * 100)
      });
    } else {
      monthlyRates.push({
        name: monthNames[m],
        rate: 0
      });
    }
  }

  // 10. Recent activity
  const sortedAttendances = [...targetAttendances].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  ).slice(0, 10);

  const studentMap = {};
  students.forEach(s => {
    studentMap[s.id] = `${s.firstName} ${s.lastName}`;
  });

  const recentActivities = sortedAttendances.map(a => {
    const dateObj = new Date(a.updatedAt || a.createdAt);
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let displayTime = timeStr;
    if (range !== 'Today') {
      const dateStr = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      displayTime = `${dateStr}, ${timeStr}`;
    }

    return {
      time: displayTime,
      name: studentMap[a.studentId] || 'Unknown Student',
      status: a.status
    };
  });

  res.json({
    data: {
      stats: {
        total,
        totalSlots,
        present,
        absent,
        leave,
        outing,
        late,
        pending,
        rate
      },
      weeklyTrend: {
        '7D': weeklyTrend7D,
        '30D': weeklyTrend30D,
        'Today': weeklyTrendToday
      },
      courseAttendance,
      yearAttendance,
      blockAttendance,
      attentionStudents,
      monthlyRates,
      recentActivities
    }
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  await sequelize.transaction(async (transaction) => {
    // 1. Get active bed allocations to update room capacity if needed
    const activeAlloc = await BedAllocation.findOne({
      where: { studentId: student.id, status: 'active' },
      transaction
    });

    if (activeAlloc) {
      const room = await Room.findByPk(activeAlloc.roomId, { transaction });
      if (room) {
        const occupiedBeds = await BedAllocation.count({
          where: { roomId: room.id, status: 'active', id: { [Op.ne]: activeAlloc.id } },
          transaction
        });
        
        const nextStatus = occupiedBeds === 0 ? 'Available' : 'Occupied';
        await room.update({ status: nextStatus }, { transaction });
      }
      
      await activeAlloc.update({ status: 'vacated', vacatedAt: new Date() }, { transaction });
    }

    // 2. Delete linked User account
    if (student.userId) {
      await User.destroy({ where: { id: student.userId }, transaction });
    }

    // 3. Delete Student
    await student.destroy({ transaction });
  });

  res.json({ message: 'Student and linked login credentials deleted successfully.' });
});

// ── Update student ────────────────────────────────────────────────────────────

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const { registrationNumber, email } = req.body;

  if (email && email.trim().toLowerCase() !== student.email) {
    const existingEmail = await Student.findOne({
      where: { email: email.trim().toLowerCase() }
    });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use by another student.' });
    }
  }

  if (registrationNumber && registrationNumber !== student.registrationNumber) {
    const existingReg = await Student.findOne({
      where: { registrationNumber }
    });
    if (existingReg) {
      return res.status(400).json({ message: 'Registration number is already in use.' });
    }
  }

  await sequelize.transaction(async (transaction) => {
    // 0. Resolve normalized department/course/year fields
    const academicFields = await resolveAcademicFields(req.body);

    // 1. Update associated User email if email changed
    if (email && email.trim().toLowerCase() !== student.email && student.userId) {
      const user = await User.findByPk(student.userId, { transaction });
      if (user) {
        await user.update({ email: email.trim().toLowerCase() }, { transaction });
      }
    }

    // 2. Update student details
    const studentUpdateData = { ...req.body, ...academicFields };
    if (studentUpdateData.status === 'Not Marked') {
      delete studentUpdateData.status;
    }
    await student.update(studentUpdateData, { transaction });

    // Sync today's attendance if a status was explicitly passed
    if (req.body.status && ['Present', 'Absent', 'Outing', 'Leave', 'Late'].includes(req.body.status)) {
      const today = new Date().toISOString().slice(0, 10);
      const [attendance, created] = await StudentAttendance.findOrCreate({
        where: { studentId: student.id, attendanceDate: today },
        defaults: { studentId: student.id, attendanceDate: today, status: req.body.status },
        transaction
      });
      if (!created) {
        await attendance.update({ status: req.body.status }, { transaction });
      }
    }

    // 3. Update allocation details if provided
    const allocationData = req.body.allocation;
    if (allocationData && allocationData.roomNumber && allocationData.bedNumber) {
      // Find current active allocation
      const activeAlloc = await BedAllocation.findOne({
        where: { studentId: student.id, status: 'active' },
        include: [{ model: Room, as: 'room' }],
        transaction
      });

      const newRoomNumber = String(allocationData.roomNumber || '').trim().toUpperCase();
      const newBedNumber = String(allocationData.bedNumber || '').trim();

      const isSameAllocation = activeAlloc && 
        activeAlloc.room?.number === newRoomNumber && 
        activeAlloc.bedNumber === newBedNumber;

      if (!isSameAllocation) {
        // Vacate current allocation if exists
        if (activeAlloc) {
          const oldRoom = await Room.findByPk(activeAlloc.roomId, { transaction, lock: transaction.LOCK.UPDATE });
          if (oldRoom) {
            const occupiedBeds = await BedAllocation.count({
              where: { roomId: oldRoom.id, status: 'active', id: { [Op.ne]: activeAlloc.id } },
              transaction
            });
            const nextStatus = occupiedBeds === 0 ? 'Available' : 'Occupied';
            await oldRoom.update({ status: nextStatus }, { transaction });
          }
          await activeAlloc.update({ status: 'transferred', vacatedAt: new Date() }, { transaction });
        }

        // Allocate new room/bed
        const room = await Room.findOne({ where: { number: newRoomNumber }, transaction, lock: transaction.LOCK.UPDATE });
        if (!room) throw Object.assign(new Error('Selected room was not found in the database.'), { status: 404 });
        if (room.status === 'Maintenance') throw Object.assign(new Error('Maintenance rooms cannot receive allocations.'), { status: 409 });

        const occupiedBeds = await BedAllocation.count({ where: { roomId: room.id, status: 'active' }, transaction });
        if (occupiedBeds >= room.capacity) throw Object.assign(new Error('Selected room is already full.'), { status: 409 });

        const occupiedBed = await BedAllocation.findOne({
          where: { roomId: room.id, bedNumber: newBedNumber, status: 'active' },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (occupiedBed) throw Object.assign(new Error('Selected bed is already allocated.'), { status: 409 });

        await BedAllocation.create({
          studentId: student.id,
          roomId: room.id,
          bedNumber: newBedNumber,
          allocatedAt: allocationData.allocatedAt || new Date(),
        }, { transaction });

        await room.update({
          status: occupiedBeds + 1 >= room.capacity ? 'Full' : 'Occupied',
        }, { transaction });
      }
    }
  });

  res.json({ message: 'Student details updated successfully.', data: student });
});

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid amount is required.' });
  }

  const authHeader = 'Basic ' + Buffer.from(`${env.razorpay.key}:${env.razorpay.secret}`).toString('base64');
  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // convert to paisa
        currency: 'INR',
        receipt: `rcpt_${student.id.slice(0, 8)}_${Date.now()}`,
      }),
    });

    const order = await response.json();
    if (!response.ok) {
      throw new Error(order.error?.description || 'Razorpay order creation failed.');
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.razorpay.key,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment order.' });
  }
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Razorpay payment ID, order ID, and signature are required.' });
  }

  const crypto = await import('crypto');
  const shasum = crypto.createHmac('sha256', env.razorpay.secret);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed: Signature mismatch.' });
  }

  const result = await sequelize.transaction(async (transaction) => {
    const paidAmount = Number(amount);
    const currentDeposit = student.initialDeposit || 0;
    const newDeposit = currentDeposit + paidAmount;

    let status = 'Pending';
    if (newDeposit >= (student.totalFees || 0)) {
      status = 'Paid';
    } else if (newDeposit > 0) {
      status = 'Partial';
    }

    await student.update({
      initialDeposit: newDeposit,
      paymentStatus: status,
    }, { transaction });

    const receiptNo = `REC${String(Date.now()).slice(-6)}`;
    const payment = await Payment.create({
      studentId: student.id,
      receiptNo,
      amount: paidAmount,
      paymentMode: 'Razorpay',
      status: 'Success',
      transactionId: razorpay_payment_id,
    }, { transaction });

    return { student, payment };
  });

  res.json({ message: 'Payment verified and recorded successfully.', data: result });
});

export const getFinanceAnalytics = asyncHandler(async (req, res) => {
  const targetDateStr = req.query.date || new Date().toISOString().slice(0, 10);
  const targetYear = new Date(targetDateStr).getFullYear() || new Date().getFullYear();

  // 1. Fetch all students with active allocations and payments
  const students = await Student.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['role'],
        where: { role: 'student' }
      },
      {
        model: BedAllocation,
        as: 'allocations',
        where: { status: 'active' },
        required: false,
        include: [{
          model: Room,
          as: 'room',
          include: [{
            model: Floor,
            as: 'floor',
            include: [{
              model: HostelBlock,
              as: 'block'
            }]
          }]
        }]
      },
      {
        model: Payment,
        as: 'payments',
        required: false
      }
    ]
  });

  // Fetch all successful payments
  const allPayments = await Payment.findAll({
    where: { status: 'Success' },
    order: [['createdAt', 'ASC']]
  });

  // 2. Compute KPI summary stats
  let totalRevenue = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let paidCount = 0;
  let partialCount = 0;
  let pendingCount = 0;
  let paidAmount = 0;
  let partialAmount = 0;
  let pendingAmountSum = 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = Array(12).fill(0);
  const monthlyCollected = Array(12).fill(0);
  const monthlyPending = Array(12).fill(0);

  const courseMap = {};
  const blockMap = {};
  const pendingStudentsList = [];

  students.forEach((s) => {
    const totalFee = Number(s.totalFees) || 0;
    const initialDep = Number(s.initialDeposit) || 0;

    const studentPaymentsSum = (s.payments || [])
      .filter((p) => p.status === 'Success')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const paid = Math.max(initialDep, studentPaymentsSum);
    const pending = Math.max(0, totalFee - paid);

    totalRevenue += totalFee;
    totalCollected += paid;
    totalPending += pending;

    // Payment distribution
    if (pending === 0 && totalFee > 0) {
      paidCount++;
      paidAmount += paid;
    } else if (paid > 0) {
      partialCount++;
      partialAmount += paid;
      pendingAmountSum += pending;
    } else {
      pendingCount++;
      pendingAmountSum += pending;
    }

    // Top pending list
    if (pending > 0) {
      const activeAlloc = (s.allocations || [])[0];
      const roomNum = activeAlloc?.room?.number || '—';
      pendingStudentsList.push({
        name: `${s.firstName} ${s.lastName}`,
        room: roomNum,
        amount: pending,
        dueDate: s.admissionDate || `${targetYear}-09-30`,
        status: paid > 0 ? 'Partial' : 'Pending'
      });
    }

    // Course collection
    const courseName = s.course || 'Unknown';
    if (!courseMap[courseName]) {
      courseMap[courseName] = { course: courseName, Collected: 0, Revenue: 0 };
    }
    courseMap[courseName].Collected += paid;
    courseMap[courseName].Revenue += totalFee;

    // Block breakdown
    const activeAlloc = (s.allocations || [])[0];
    const blockName = activeAlloc?.room?.floor?.block?.name || 'Unassigned';
    if (!blockMap[blockName]) {
      blockMap[blockName] = { block: blockName, total: 0, paid: 0, partial: 0, pending: 0 };
    }
    blockMap[blockName].total++;
    if (pending === 0 && totalFee > 0) {
      blockMap[blockName].paid++;
    } else if (paid > 0) {
      blockMap[blockName].partial++;
    } else {
      blockMap[blockName].pending++;
    }

    // Monthly revenue mapping
    const createdDate = new Date(s.admissionDate || s.createdAt);
    if (createdDate.getFullYear() === targetYear) {
      const m = createdDate.getMonth();
      monthlyRevenue[m] += totalFee;
      monthlyPending[m] += pending;
    }
  });

  // Monthly collected from payments
  allPayments.forEach((p) => {
    const payDate = new Date(p.createdAt);
    if (payDate.getFullYear() === targetYear) {
      const m = payDate.getMonth();
      monthlyCollected[m] += Number(p.amount || 0);
    }
  });

  const totalMonthlyCollectedSum = monthlyCollected.reduce((a, b) => a + b, 0);
  if (totalMonthlyCollectedSum === 0 && totalCollected > 0) {
    const currentMonthIdx = new Date().getMonth();
    monthlyCollected[currentMonthIdx] = totalCollected;
  }

  // Monthly Trend Data
  const annualTrendData = monthNames.map((name, idx) => ({
    name,
    revenue: monthlyCollected[idx] > 0 ? monthlyCollected[idx] : monthlyRevenue[idx]
  }));

  // Collection vs Pending by Month
  const collectionVsPendingData = monthNames.map((name, idx) => ({
    name,
    Collected: monthlyCollected[idx],
    Pending: monthlyPending[idx]
  }));

  // Payment Distribution Data
  const totalStudents = students.length || 1;
  const paymentDistributionData = [
    {
      name: 'Paid',
      value: paidAmount,
      percentage: Math.round((paidCount / totalStudents) * 100),
      color: '#16A34A'
    },
    {
      name: 'Partial',
      value: partialAmount,
      percentage: Math.round((partialCount / totalStudents) * 100),
      color: '#F59E0B'
    },
    {
      name: 'Pending',
      value: pendingAmountSum,
      percentage: Math.round((pendingCount / totalStudents) * 100),
      color: '#DC2626'
    }
  ];

  // Course Collection Data
  const courseCollectionData = Object.values(courseMap);

  // Block Outstanding Data
  const blockOutstandingData = Object.values(blockMap).map((b) => ({
    block: b.block,
    Paid: b.total > 0 ? Math.round((b.paid / b.total) * 100) : 0,
    Partial: b.total > 0 ? Math.round((b.partial / b.total) * 100) : 0,
    Pending: b.total > 0 ? Math.round((b.pending / b.total) * 100) : 0
  }));

  // Top Pending Students
  const topPendingStudents = pendingStudentsList
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Quick Insights
  let maxMonthIdx = 0;
  monthlyRevenue.forEach((rev, i) => {
    if (rev > monthlyRevenue[maxMonthIdx]) maxMonthIdx = i;
  });
  const maxMonthName = monthNames[maxMonthIdx];
  const maxMonthRev = monthlyRevenue[maxMonthIdx];

  let minMonthIdx = 0;
  let minMonthVal = Infinity;
  monthlyCollected.forEach((col, i) => {
    if (col < minMonthVal) {
      minMonthVal = col;
      minMonthIdx = i;
    }
  });

  let mostPendingBlockName = 'None';
  let maxBlockPending = 0;
  Object.values(blockMap).forEach((b) => {
    if (b.pending > maxBlockPending) {
      maxBlockPending = b.pending;
      mostPendingBlockName = b.block;
    }
  });

  let bestDept = '—';
  let bestDeptRate = 0;
  Object.values(courseMap).forEach((c) => {
    const rate = c.Revenue > 0 ? Math.round((c.Collected / c.Revenue) * 100) : 0;
    if (rate >= bestDeptRate) {
      bestDeptRate = rate;
      bestDept = c.course;
    }
  });

  let pendingDept = '—';
  let maxDeptPending = 0;
  Object.values(courseMap).forEach((c) => {
    const pendingVal = Math.max(0, c.Revenue - c.Collected);
    if (pendingVal >= maxDeptPending) {
      maxDeptPending = pendingVal;
      pendingDept = c.course;
    }
  });

  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

  const quickInsights = [
    {
      title: 'Highest Revenue Month',
      value: maxMonthRev > 0 ? `${maxMonthName} (₹${(maxMonthRev / 100000).toFixed(2)}L)` : `${maxMonthName} (₹0)`,
      desc: 'Based on student fee enrollments',
      color: '#16A34A',
      bg: 'rgba(22, 163, 74, 0.1)'
    },
    {
      title: 'Lowest Collection Month',
      value: `${monthNames[minMonthIdx]} (${minMonthVal === Infinity || minMonthVal === 0 ? '0%' : '₹' + minMonthVal.toLocaleString('en-IN')})`,
      desc: 'Period with lowest collections',
      color: '#DC2626',
      bg: 'rgba(220, 38, 38, 0.1)'
    },
    {
      title: 'Most Pending Block',
      value: mostPendingBlockName,
      desc: maxBlockPending > 0 ? `${maxBlockPending} student(s) with dues` : 'No outstanding block dues',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
    {
      title: 'Best Paying Department',
      value: bestDept,
      desc: `${bestDeptRate}% overall collection rate`,
      color: '#4F46E5',
      bg: 'rgba(79, 70, 229, 0.1)'
    },
    {
      title: 'Highest Pending Department',
      value: pendingDept,
      desc: maxDeptPending > 0 ? `₹${maxDeptPending.toLocaleString('en-IN')} outstanding` : 'No outstanding fees',
      color: '#EA580C',
      bg: 'rgba(234, 88, 12, 0.1)'
    }
  ];

  res.json({
    data: {
      stats: {
        totalRevenue,
        totalCollected,
        totalPending,
        collectionRate
      },
      annualTrendData,
      paymentDistributionData,
      collectionVsPendingData,
      courseCollectionData,
      blockOutstandingData,
      topPendingStudents,
      quickInsights
    }
  });
});
