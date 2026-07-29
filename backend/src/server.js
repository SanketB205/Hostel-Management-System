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
    } catch (err) {
      console.warn('Failed to alter users role enum:', err.message);
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
