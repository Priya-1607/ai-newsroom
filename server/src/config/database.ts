import mongoose from 'mongoose';
import logger from '../utils/logger';

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  uri: string;
  dbName?: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  connectTimeout?: number;
  socketTimeout?: number;
}

/**
 * Get database configuration from environment variables
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-news',
    dbName: process.env.MONGODB_DB_NAME,
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
    connectTimeout: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '10000', 10),
    socketTimeout: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10),
  };
};

/**
 * Create MongoDB connection options
 */
const createConnectionOptions = (config: DatabaseConfig): mongoose.ConnectOptions => {
  const options: mongoose.ConnectOptions = {
    maxPoolSize: config.maxPoolSize,
    minPoolSize: config.minPoolSize,
    connectTimeoutMS: config.connectTimeout,
    socketTimeoutMS: config.socketTimeout,
  };

  if (config.dbName) {
    options.dbName = config.dbName;
  }

  return options;
};

/**
 * Connect to MongoDB with proper configuration
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  const config = getDatabaseConfig();
  const options = createConnectionOptions(config);

  // Set mongoose debug mode in development
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      logger.debug(`Mongoose: ${collectionName}.${method}`, { query, doc });
    });
  }

  // Event handlers
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost');
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await gracefulShutdown();
  });

  process.on('SIGTERM', async () => {
    await gracefulShutdown();
  });

  try {
    const connection = await mongoose.connect(config.uri, options);
    logger.info(`Connected to MongoDB: ${config.uri}`);
    return connection;
  } catch (error: any) {
    logger.error('Failed to connect to MongoDB', { 
      error: error.message,
      uri: config.uri.replace(/\/\/.*@/, '//***:***@') // Hide credentials in logs
    });
    throw error;
  }
};

/**
 * Graceful shutdown - close database connection
 */
export const gracefulShutdown = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during MongoDB shutdown', { error: error.message });
    process.exit(1);
  }
};

/**
 * Get connection status
 */
export const getConnectionStatus = (): string => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Check if database is connected
 */
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export default {
  connectDatabase,
  gracefulShutdown,
  getConnectionStatus,
  isConnected,
  getDatabaseConfig,
};

