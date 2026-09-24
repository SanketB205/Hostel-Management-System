import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Student, Payment } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── Get student payment summary and history ───────────────────────────────────

export const getStudentPayments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Verify student exists
  const student = await Student.findByPk(studentId, {
    include: [
      {
        model: Payment,
        as: 'payments',
        order: [['createdAt', 'DESC']], // Newest first
      }
    ]
  });

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  // Calculate totals from successful payments only
  const successfulPayments = (student.payments || []).filter(p => p.status === 'Success');
  const totalPaid = successfulPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
  const totalBillable = parseFloat(student.totalBillable || 0);
  const balanceDue = Math.max(0, totalBillable - totalPaid);

  // Determine payment status
  let paymentStatus = 'Pending';
  if (totalPaid === 0) {
    paymentStatus = 'Pending';
  } else if (balanceDue === 0) {
    paymentStatus = 'Paid in Full';
  } else {
    paymentStatus = 'Partial';
  }

  // Map payments to frontend format
  const payments = (student.payments || []).map(p => ({
    id: p.id,
    date: p.paymentDate || p.createdAt, // Use paymentDate if available, fallback to createdAt
    amount: parseFloat(p.amount),
    mode: p.paymentMode,
    reference: p.transactionId || '',
    notes: p.notes || '',
    receivedBy: p.receivedBy || 'Admin',
    receipt: null, // For future implementation
    status: p.status,
    receiptNo: p.receiptNo,
  }));

  res.json({
    data: {
      studentId: student.id,
      totalBillable,
      totalPaid,
      balanceDue,
      paymentStatus,
      payments
    }
  });
});

// ── Create new payment ────────────────────────────────────────────────────────

export const createPayment = asyncHandler(async (req, res) => {
  const { studentId, amount, paymentMode, transactionId, paymentDate, notes, receivedBy } = req.body;

  // Validate required fields
  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required.' });
  }

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Payment amount must be greater than zero.' });
  }

  if (!paymentMode) {
    return res.status(400).json({ message: 'Payment mode is required.' });
  }

  const result = await sequelize.transaction(async (transaction) => {
    // 1. Verify student exists and get current balance
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Payment,
          as: 'payments',
          where: { status: 'Success' },
          required: false
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!student) {
      throw Object.assign(new Error('Student not found.'), { status: 404 });
    }

    // 2. Calculate current balance
    const totalBillable = parseFloat(student.totalBillable || 0);
    const totalPaid = (student.payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const currentBalance = Math.max(0, totalBillable - totalPaid);

    // 3. Validate payment amount doesn't exceed balance
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > currentBalance) {
      throw Object.assign(
        new Error(`Payment amount ₹${paymentAmount.toLocaleString('en-IN')} exceeds current balance due ₹${currentBalance.toLocaleString('en-IN')}.`),
        { status: 400 }
      );
    }

    // 4. Generate unique receipt number
    const timestamp = Date.now();
    const receiptNo = `${student.registrationNumber}-${timestamp}`;

    // 5. Create payment record
    const payment = await Payment.create({
      studentId,
      receiptNo,
      amount: paymentAmount,
      paymentMode: paymentMode || 'Cash',
      status: 'Success', // Manual payments are marked as successful
      transactionId: transactionId || null,
      paymentDate: paymentDate || new Date(),
      notes: notes || null,
      receivedBy: receivedBy || 'Admin',
    }, { transaction });

    return payment;
  });

  // Return created payment
  res.status(201).json({
    message: 'Payment recorded successfully.',
    data: {
      id: result.id,
      date: result.paymentDate || result.createdAt,
      amount: parseFloat(result.amount),
      mode: result.paymentMode,
      reference: result.transactionId || '',
      notes: result.notes || '',
      receivedBy: result.receivedBy || 'Admin',
      receipt: null,
      status: result.status,
      receiptNo: result.receiptNo,
    }
  });
});

// ── Delete payment (Admin only) ───────────────────────────────────────────────

export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sequelize.transaction(async (transaction) => {
    const payment = await Payment.findByPk(id, { transaction });

    if (!payment) {
      throw Object.assign(new Error('Payment record not found.'), { status: 404 });
    }

    await payment.destroy({ transaction });
    return payment;
  });

  res.json({
    message: 'Payment record deleted successfully.',
    data: { id: result.id }
  });
});
