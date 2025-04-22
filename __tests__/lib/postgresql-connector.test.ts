import { PostgreSQLConnector } from '@/lib/database/postgresql';
import { DatabaseError, QueryError } from '@/lib/database/interface';

// Mock the pg module with properly structured return values
jest.mock('pg', () => {
  // Create mock functions and objects
  const mockQuery = jest.fn();
  const mockRelease = jest.fn();
  
  // Mock client that will be returned by connect
  const mockClient = {
    query: mockQuery,
    release: mockRelease
  };
  
  // Mock pool with connect and end methods
  const mockConnect = jest.fn().mockResolvedValue(mockClient);
  const mockEnd = jest.fn().mockResolvedValue(undefined);
  
  const mockPool = {
    connect: mockConnect,
    end: mockEnd
  };
  
  // Return constructor that returns our mock pool
  return {
    Pool: jest.fn(() => mockPool)
  };
});

describe('PostgreSQLConnector', () => {
  // Get mocks for easier access
  const pg = require('pg');
  const mockPool = new pg.Pool();
  const mockConnect = mockPool.connect;
  const mockEnd = mockPool.end;
  
  // Store references to mock client and query function
  let mockClient;
  let mockQuery;
  let mockRelease;
  
  // Initialize connector for each test
  let connector;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh client mock for each test
    mockClient = { 
      query: jest.fn(),
      release: jest.fn()
    };
    mockQuery = mockClient.query;
    mockRelease = mockClient.release;
    
    // Configure connect to return our mock client
    mockConnect.mockResolvedValue(mockClient);
    
    // Create a fresh connector instance
    connector = new PostgreSQLConnector({
      connectionString: 'postgresql://user:pass@localhost:5432/testdb'
    });
  });

  describe('constructor', () => {
    test('initializes the pool with connection string', () => {
      expect(pg.Pool).toHaveBeenCalledWith({
        connectionString: 'postgresql://user:pass@localhost:5432/testdb'
      });
    });
  });

  describe('connect', () => {
    test('acquires a client from the pool', async () => {
      await connector.connect();
      expect(mockConnect).toHaveBeenCalled();
    });
    
    test('throws DatabaseError on connection failure', async () => {
      // First mock call will fail, second will succeed (for the second test assertion)
      mockConnect.mockRejectedValueOnce(new Error('Connection refused'));
      
      await expect(connector.connect()).rejects.toThrow(DatabaseError);
      // We can't test the exact message in the same test because mock would be consumed
    });

    test('includes error message in thrown DatabaseError', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Connection refused'));
      
      await expect(connector.connect()).rejects.toThrow('Failed to connect to PostgreSQL: Connection refused');
    });
  });

  describe('disconnect', () => {
    test('releases the client and ends the pool', async () => {
      // First connect to get a client
      await connector.connect();
      
      // Then disconnect
      await connector.disconnect();
      
      // Verify client was released and pool was ended
      expect(mockRelease).toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalled();
    });
    
    test('handles disconnecting when not connected', async () => {
      // Disconnect without connecting first
      await connector.disconnect();
      
      // Client shouldn't be released, but pool should be ended
      expect(mockRelease).not.toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    test('returns false when not connected', () => {
      expect(connector.isConnected()).toBe(false);
    });
    
    test('returns true after connecting', async () => {
      await connector.connect();
      expect(connector.isConnected()).toBe(true);
    });
    
    test('returns false after disconnecting', async () => {
      await connector.connect();
      await connector.disconnect();
      expect(connector.isConnected()).toBe(false);
    });
  });

  describe('getSchema', () => {
    test('auto-connects if not already connected', async () => {
      // Setup mock responses for schema queries
      const tableQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      mockQuery.mockImplementation((query, params = []) => {
        if (query.includes('information_schema.tables')) {
          return Promise.resolve({ 
            rows: [{ table_name: 'users' }] 
          });
        } else if (query.includes('information_schema.columns')) {
          return Promise.resolve({
            rows: [
              { column_name: 'id', data_type: 'integer' },
              { column_name: 'name', data_type: 'text' }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });
      
      // Call without connecting first
      const schema = await connector.getSchema();
      
      // Should have auto-connected
      expect(mockConnect).toHaveBeenCalled();
      
      // Should have queried for tables and columns
      expect(mockQuery).toHaveBeenCalledTimes(2);
      
      // Verify the returned schema
      expect(schema.tables).toHaveLength(1);
      expect(schema.tables[0].name).toBe('users');
      expect(schema.tables[0].columns).toHaveLength(2);
    });
    
    test('retrieves schema from connected database', async () => {
      // Connect first
      await connector.connect();
      
      // Setup responses based on the query parameters
      mockQuery.mockImplementation((query, params = []) => {
        if (query.includes('information_schema.tables')) {
          return Promise.resolve({
            rows: [
              { table_name: 'users' },
              { table_name: 'orders' }
            ]
          });
        } else if (query.includes('information_schema.columns')) {
          if (params[0] === 'users') {
            return Promise.resolve({
              rows: [
                { column_name: 'id', data_type: 'integer' },
                { column_name: 'name', data_type: 'text' }
              ]
            });
          } else if (params[0] === 'orders') {
            return Promise.resolve({
              rows: [
                { column_name: 'id', data_type: 'integer' },
                { column_name: 'user_id', data_type: 'integer' },
                { column_name: 'total', data_type: 'decimal' }
              ]
            });
          }
        }
        return Promise.resolve({ rows: [] });
      });
      
      // Get schema
      const schema = await connector.getSchema();
      
      // Verify queries
      expect(mockQuery).toHaveBeenCalledTimes(3); // 1 tables query + 2 columns queries
      
      // Verify schema content
      expect(schema.tables).toHaveLength(2);
      
      expect(schema.tables[0].name).toBe('users');
      expect(schema.tables[0].columns).toHaveLength(2);
      expect(schema.tables[0].columns[0].name).toBe('id');
      
      expect(schema.tables[1].name).toBe('orders');
      expect(schema.tables[1].columns).toHaveLength(3);
      expect(schema.tables[1].columns[2].name).toBe('total');
      expect(schema.tables[1].columns[2].dataType).toBe('decimal');
    });
    
    test('throws DatabaseError on schema retrieval failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Permission denied'));
      
      await expect(connector.getSchema()).rejects.toThrow(DatabaseError);
      
      // Clear the mock and set up a new rejection for the next call
      mockQuery.mockReset();
      mockQuery.mockRejectedValueOnce(new Error('Permission denied'));
      
      await expect(connector.getSchema()).rejects.toThrow('Failed to get schema: Permission denied');
    });
  });

  describe('executeQuery', () => {
    test('auto-connects if not already connected', async () => {
      // Setup mock query response for SELECT
      mockQuery.mockResolvedValueOnce({
        fields: [{ name: 'id' }, { name: 'name' }],
        rows: [{ id: 1, name: 'Alice' }]
      });
      
      // Execute query without connecting first
      const result = await connector.executeQuery('SELECT * FROM users');
      
      // Should have auto-connected
      expect(mockConnect).toHaveBeenCalled();
      
      // Verify query was executed
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users');
      
      // Verify result format
      expect(result.columns).toEqual(['id', 'name']);
      expect(result.rows).toEqual([{ id: 1, name: 'Alice' }]);
    });
    
    test('executes SELECT query correctly', async () => {
      // Connect first
      await connector.connect();
      
      // Setup mock query response
      mockQuery.mockResolvedValueOnce({
        fields: [{ name: 'id' }, { name: 'name' }],
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      });
      
      // Execute query
      const result = await connector.executeQuery('SELECT * FROM users');
      
      // Verify query was executed
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users');
      
      // Verify result format for SELECT
      expect(result.columns).toEqual(['id', 'name']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[1].name).toBe('Bob');
    });
    
    test('handles non-SELECT queries (INSERT, UPDATE, DELETE)', async () => {
      await connector.connect();
      
      // Create a special mock for this case that matches exactly what's expected
      const mockNonSelectResult = {
        rowCount: 5,
        rows: undefined, // This is key - we need rows to be actually undefined to hit the non-SELECT path
        fields: []
      };
      
      // Set the mock response
      mockQuery.mockResolvedValueOnce(mockNonSelectResult);
      
      // Execute query
      const result = await connector.executeQuery('DELETE FROM users WHERE inactive = true');
      
      // Verify the query was executed
      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM users WHERE inactive = true');
      
      // Verify result format for non-SELECT according to the implementation
      expect(result.columns).toEqual([]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ affectedRows: 5 });
    });
    
    test('throws QueryError on query execution failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Syntax error'));
      
      await expect(connector.executeQuery('INVALID SQL')).rejects.toThrow(QueryError);
      
      // Reset mock for the second assertion
      mockQuery.mockReset();
      mockQuery.mockRejectedValueOnce(new Error('Syntax error'));
      
      await expect(connector.executeQuery('INVALID SQL')).rejects.toThrow('Query execution failed: Syntax error');
    });
  });
});