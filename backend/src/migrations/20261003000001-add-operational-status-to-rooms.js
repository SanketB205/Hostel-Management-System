/**
 * Migration: Add operational_status to rooms table
 *
 * Adds a new ENUM column `operational_status` (Available | Maintenance | Reserved)
 * that stores the admin-controlled status separately from the computed occupancy status.
 * Existing rows whose `status` is 'Maintenance' are backfilled to
 * `operational_status = 'Maintenance'` so no data is lost.
 */

export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // 1. Add the new column
    await queryInterface.addColumn(
      'rooms',
      'operational_status',
      {
        type: Sequelize.ENUM('Available', 'Maintenance', 'Reserved'),
        allowNull: false,
        defaultValue: 'Available',
        comment: 'Admin-controlled operational status. Occupied/Full are computed, not stored here.',
      },
      { transaction }
    );

    // 2. Backfill: rooms that were manually set to Maintenance keep that setting
    await queryInterface.sequelize.query(
      `UPDATE rooms SET operational_status = 'Maintenance' WHERE status = 'Maintenance'`,
      { transaction }
    );

    await transaction.commit();
    console.log('✓ operational_status column added and backfilled.');
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.removeColumn('rooms', 'operational_status', { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
