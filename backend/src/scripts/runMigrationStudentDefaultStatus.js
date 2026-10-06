import { sequelize } from '../config/database.js';
import { up } from '../migrations/20261004000001-change-student-default-status-to-not-marked.js';

async function run() {
  try {
    console.log('Running migration: change-student-default-status-to-not-marked …');
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
