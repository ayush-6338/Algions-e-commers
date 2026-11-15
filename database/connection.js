import mongoose from 'mongoose';

export async function connectDB(uri = process.env.MONGO_URI || process.env.MONGODB_URI) {
  const cached = global._mongoose || (global._mongoose = { conn: null, promise: null });
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!uri) throw new Error('MONGO_URI is required');
    cached.promise = mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 8000,
    }).then(async (connection) => {
      const hello = await mongoose.connection.db.admin().command({ hello: 1 });
      if (!hello.setName) {
        throw new Error('MongoDB transactions require a replica set. Use an Atlas cluster or configure a local single-node replica set (for example, rs0).');
      }
      cached.conn = connection;
      return connection;
    }).catch(async (error) => {
      cached.promise = null;
      cached.conn = null;
      await mongoose.disconnect().catch(() => {});
      throw error;
    });
  }

  return cached.promise;
}

// Keep the existing name available to the seed scripts and tests.
export const connectDatabase = connectDB;

export async function disconnectDatabase() {
  const cached = global._mongoose;
  if (cached) {
    cached.conn = null;
    cached.promise = null;
  }
  await mongoose.disconnect();
}
