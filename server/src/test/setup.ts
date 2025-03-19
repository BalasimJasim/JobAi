import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { SessionManager } from '../utils/session';
import { Types } from 'mongoose';

declare global {
  var createTestUser: (data?: Partial<any>) => Promise<any>;
  var generateAuthToken: (userId: string) => Promise<{ accessToken: string; refreshToken: string }>;
}

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  // Connect to the in-memory database
  await connectDatabase();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = await mongoose.connection.db!.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  // Close the MongoDB connection and stop the server
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global test utilities
global.createTestUser = async (data = {}) => {
  return await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'ACTIVE',
    isEmailVerified: true,
    ...data
  });
};

global.generateAuthToken = async (userId: string) => {
  return SessionManager.generateTokens(new Types.ObjectId(userId), 'test@example.com', 0);
}; 