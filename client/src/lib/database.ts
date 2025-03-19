import { MongoClient, Db } from 'mongodb';
import clientPromise from './mongodb';

/**
 * Provides a convenience wrapper for database operations
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'jobai');
}

/**
 * Utility for health checking the database connection
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    // Run a simple command to check connection
    await client.db().command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * Get the MongoDB client instance
 */
export async function getClient(): Promise<MongoClient> {
  return clientPromise;
} 