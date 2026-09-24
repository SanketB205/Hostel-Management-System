import { sequelize } from '../config/database.js';
import { up } from '../migrations/20260923000001-add-totalBillable-and-update-payments.js';

async function runMigration() {
  try {
    console.log('Starting migration: add-totalBillable-and-update-payments...');
    
    await up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
