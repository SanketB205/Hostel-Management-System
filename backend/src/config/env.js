import 'dotenv/config';

const requiredInProduction = ['DB_NAME', 'DB_USER', 'JWT_SECRET'];

if (process.env.NODE_ENV === 'production') {
  requiredInProduction.forEach((key) => {
    if (!process.env[key]) throw new Error(`${key} must be configured in production.`);
  });
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'hostelspace',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin123@gmail.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin@123',
};
