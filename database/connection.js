import mongoose from 'mongoose';

export async function connectDatabase(uri = process.env.MONGO_URI || process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is required (MONGO_URI is also accepted)');
  await mongoose.connect(uri, { autoIndex: process.env.NODE_ENV !== 'production' });
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName) throw new Error('MongoDB transactions require a replica set. Use an Atlas cluster or configure a local single-node replica set (for example, rs0).');
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
