import { app } from './app.js';
import { sequelize } from './config/database.js';
import { env } from './config/env.js';
import './models/index.js';
import { seedAdmin } from './services/seedAdmin.js';

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Replace with migrations before production deployment.
    try {
      await sequelize.query("UPDATE users SET role = 'rector' WHERE role = 'staff'");
      await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'rector', 'student') NOT NULL DEFAULT 'student'");
      await sequelize.query("ALTER TABLE bed_allocations MODIFY COLUMN status ENUM('active', 'vacated', 'transferred') NOT NULL DEFAULT 'active'");
    } catch (err) {
      console.warn('Failed to alter enums:', err.message);
    }
    try {
      await sequelize.query("ALTER TABLE students ADD COLUMN total_fees INT NULL");
    } catch (err) {
      console.warn('Failed to add total_fees column:', err.message);
    }
    try {
      await sequelize.query("ALTER TABLE students ADD COLUMN initial_deposit INT NULL");
    } catch (err) {
      console.warn('Failed to add initial_deposit column:', err.message);
    }
    try {
      await sequelize.query("ALTER TABLE students ADD COLUMN payment_status ENUM('Paid', 'Partial', 'Pending') NOT NULL DEFAULT 'Pending'");
    } catch (err) {
      console.warn('Failed to add payment_status column:', err.message);
    }
    await seedAdmin();

    app.listen(env.port, () => {
      console.info(`HostelSpace API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Unable to start HostelSpace API:', error.message);
    process.exit(1);
  }
}

startServer();
