import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../connection.js';
import { User } from '../models/User.js';

const accounts = [
  { name: 'SkyKart Admin', email: 'admin@example.com', password: 'AdminPass123!', role: 'admin' },
  { name: 'Demo Customer', email: 'customer@example.com', password: 'CustomerPass123!', role: 'customer' },
];

try {
  await connectDatabase();
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await User.updateOne(
      { email: account.email },
      { $set: { name: account.name, passwordHash, role: account.role } },
      { upsert: true },
    );
  }
  console.log('Auth accounts ready (development credentials):');
  for (const account of accounts) console.log(`${account.role}: ${account.email} / ${account.password}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
