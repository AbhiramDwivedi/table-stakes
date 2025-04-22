import { createDatabaseConnector } from '@/lib/database/factory';
import { PostgreSQLConnector } from '@/lib/database/postgresql';

// Mock the PostgreSQL connector
jest.mock('@/lib/database/postgresql');

describe('Database Factory', () => {
  // Save original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a fresh copy of environment variables for each test
    process.env = { ...originalEnv };
    jest.resetAllMocks();
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  test('creates PostgreSQL connector by default', () => {
    // Set up test environment
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    
    // Call factory function
    createDatabaseConnector();
    
    // Verify that PostgreSQLConnector constructor was called with correct config
    expect(PostgreSQLConnector).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@localhost:5432/testdb',
    });
  });

  test('creates PostgreSQL connector when explicitly specified', () => {
    // Set up test environment
    process.env.DATABASE_TYPE = 'postgresql';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    
    // Call factory function
    createDatabaseConnector();
    
    // Verify that PostgreSQLConnector constructor was called with correct config
    expect(PostgreSQLConnector).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@localhost:5432/testdb',
    });
  });

  test('throws error for unsupported database type', () => {
    // Set up test environment
    process.env.DATABASE_TYPE = 'unsupported';
    process.env.DATABASE_URL = 'something://localhost';
    
    // Function should throw error
    expect(() => createDatabaseConnector()).toThrow('Unsupported database type: unsupported');
  });

  test('throws error when DATABASE_URL environment variable is missing', () => {
    // Remove the connection string from environment
    delete process.env.DATABASE_URL;
    
    // Function should throw error
    expect(() => createDatabaseConnector()).toThrow('DATABASE_URL environment variable is required');
  });
});