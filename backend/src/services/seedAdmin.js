import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/index.js';

export async function seedAdmin() {
  const existingAdmin = await User.scope('withPassword').findOne({ where: { email: env.seedAdminEmail.toLowerCase() } });
  if (existingAdmin) return;

  await User.create({
    email: env.seedAdminEmail.toLowerCase(),
    passwordHash: await bcrypt.hash(env.seedAdminPassword, 12),
    role: 'admin',
  });
  console.info(`Seeded Admin account: ${env.seedAdminEmail}`);
}
