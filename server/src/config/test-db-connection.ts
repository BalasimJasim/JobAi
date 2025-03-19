import { connectDatabase, disconnectDatabase } from './database';

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    
    // Try to connect
    await connectDatabase();
    
    // Wait for 2 seconds to check the connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Disconnect
    await disconnectDatabase();
    
    console.log('Database connection test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database connection test failed:', error);
    process.exit(1);
  }
};

// Run the test
testConnection(); 