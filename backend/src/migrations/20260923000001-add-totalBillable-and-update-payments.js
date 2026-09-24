/**
 * Migration: Add totalBillable to students table and enhance payments table
 * 
 * Changes:
 * 1. Add totalBillable column to students (DECIMAL for currency)
 * 2. Add paymentDate and notes columns to payments table
 * 3. Add receivedBy column to payments table
 * 
 * Note: Keeps existing totalFees, initialDeposit, paymentStatus for backward compatibility
 */

export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // 1. Add totalBillable to students table
    await queryInterface.addColumn(
      'students',
      'total_billable',
      {
        type: Sequelize.DECIMAL(10, 2), // Up to 99,999,999.99
        allowNull: true, // Allow null for existing students
        comment: 'Total hostel fee amount payable by the student',
      },
      { transaction }
    );

    // 2. Add paymentDate to payments table
    await queryInterface.addColumn(
      'payments',
      'payment_date',
      {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
        comment: 'Date and time when payment was made',
      },
      { transaction }
    );

    // 3. Add notes to payments table
    await queryInterface.addColumn(
      'payments',
      'notes',
      {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes or remarks about the payment',
      },
      { transaction }
    );

    // 4. Add receivedBy to payments table
    await queryInterface.addColumn(
      'payments',
      'received_by',
      {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Name of admin/staff who received the payment',
      },
      { transaction }
    );

    // 5. Update amount column to use DECIMAL instead of INTEGER for better currency handling
    await queryInterface.changeColumn(
      'payments',
      'amount',
      {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Payment amount',
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Remove added columns
    await queryInterface.removeColumn('students', 'total_billable', { transaction });
    await queryInterface.removeColumn('payments', 'payment_date', { transaction });
    await queryInterface.removeColumn('payments', 'notes', { transaction });
    await queryInterface.removeColumn('payments', 'received_by', { transaction });

    // Revert amount column back to INTEGER
    await queryInterface.changeColumn(
      'payments',
      'amount',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
