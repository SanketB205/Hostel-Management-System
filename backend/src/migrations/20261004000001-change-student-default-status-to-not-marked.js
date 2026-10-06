/**
 * Migration: Change default value of students.status to 'Not Marked'
 */

export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.changeColumn(
      'students',
      'status',
      {
        type: Sequelize.ENUM('Present', 'Absent', 'Outing', 'Leave', 'Late', 'Not Marked'),
        allowNull: false,
        defaultValue: 'Not Marked',
      },
      { transaction }
    );

    await transaction.commit();
    console.log('✓ students.status default value changed to Not Marked.');
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.changeColumn(
      'students',
      'status',
      {
        type: Sequelize.ENUM('Present', 'Absent', 'Outing', 'Leave', 'Late', 'Not Marked'),
        allowNull: false,
        defaultValue: 'Present',
      },
      { transaction }
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
