import { sequelize } from '../config/database.js';
import { up } from '../migrations/20261003000001-add-operational-status-to-rooms.js';

async function run() {
  try {
    console.log('Running migration: add-operational-status-to-rooms …');
    await up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

run();
