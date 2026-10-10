import { Student, Payment } from '../models/index.js';

/**
 * Finance Service
 * 
 * Centralized service for calculating student financial summaries.
 * READ-ONLY operations - does not modify any database records.
 * 
 * SOURCE OF TRUTH:
 * - Student.totalBillable (primary billing amount)
 * - Payment records where status = 'Success'
 * 
 * LEGACY FIELDS (not used in calculations):
 * - Student.totalFees
 * - Student.initialDeposit
 * - Student.paymentStatus
 */

/**
 * Calculate a student's complete financial summary
 * 
 * @param {string} studentId - UUID of the student
 * @returns {Promise<{totalBillable: number, totalPaid: number, balanceDue: number, paymentStatus: string}>}
 * @throws {Error} if student not found
 */
export async function getStudentFinancialSummary(studentId) {
  // Fetch student with their payment records
  const student = await Student.findByPk(studentId, {
    include: [
      {
        model: Payment,
        as: 'payments',
        required: false, // LEFT JOIN - include students with no payments
      }
    ]
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // 1. Get totalBillable from Student.totalBillable
  // Convert DECIMAL to number, handle null/undefined safely
  const totalBillable = parseFloat(student.totalBillable || 0);

  // 2. Calculate totalPaid from successful payments only
  // Sum Payment.amount where status = 'Success'
  const successfulPayments = (student.payments || []).filter(
    payment => payment.status === 'Success'
  );
  
  const totalPaid = successfulPayments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount || 0),
    0
  );

  // 3. Calculate balanceDue
  // Never return negative balance
  const balanceDue = Math.max(0, totalBillable - totalPaid);

  // 4. Determine paymentStatus based on exact rules
  let paymentStatus;
  
  if (totalPaid === 0) {
    paymentStatus = 'Pending';
  } else if (balanceDue === 0) {
    paymentStatus = 'Paid';
  } else {
    // totalPaid > 0 && balanceDue > 0
    paymentStatus = 'Partial';
  }

  return {
    totalBillable,
    totalPaid,
    balanceDue,
    paymentStatus
  };
}
