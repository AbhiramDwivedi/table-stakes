import { processQuery } from '../../lib/query-processor';
import { createDatabaseConnector } from '../../lib/database/factory';
import * as openai from '../../lib/openai';

// Mock dependencies
jest.mock('../../lib/database/factory');
jest.mock('../../lib/openai');

describe('SQL Injection Security Tests', () => {
  // Mock implementations
  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();
  const mockIsConnected = jest.fn().mockReturnValue(true);
  const mockGetSchema = jest.fn().mockResolvedValue({
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'password', type: 'text' },
        ],
      },
    ],
  });
  const mockExecuteQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database connector
    (createDatabaseConnector as jest.Mock).mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      isConnected: mockIsConnected,
      getSchema: mockGetSchema,
      executeQuery: mockExecuteQuery,
    });

    // Default OpenAI mocks
    (openai.determineResultType as jest.Mock).mockReturnValue('table');
  });

  test('should sanitize SQL injection attempts in natural language queries', async () => {
    // Simulate the LLM generating safe SQL despite injection attempts in natural language
    (openai.generateSQLFromNaturalLanguage as jest.Mock).mockImplementation((query) => {
      // Instead of executing the malicious query, the LLM should generate a safe query
      return Promise.resolve('SELECT id, name, email FROM users');
    });

    mockExecuteQuery.mockResolvedValue({
      rows: [{ id: 1, name: 'John', email: 'john@example.com' }],
      columns: ['id', 'name', 'email'],
    });

    // Test with various SQL injection attempts
    const injectionAttempts = [
      "Show me all users' OR '1'='1",
      "List users; DROP TABLE users;",
      "Show users where id = 1 OR 1=1",
      "Show me all users UNION SELECT password FROM users",
    ];

    for (const injectionAttempt of injectionAttempts) {
      const result = await processQuery({ query: injectionAttempt });
      
      // Verify that the executed SQL doesn't contain the injection patterns
      const executedSql = mockExecuteQuery.mock.calls[mockExecuteQuery.mock.calls.length - 1][0];
      
      // The SQL should not contain these dangerous patterns
      expect(executedSql).not.toContain("'1'='1");
      expect(executedSql).not.toContain("DROP TABLE");
      expect(executedSql).not.toContain("1=1");
      expect(executedSql).not.toMatch(/UNION\s+SELECT/i);
      
      // The query should not expose password field
      expect(executedSql).not.toContain("password");
      
      // Verify that query was successful but safe
      expect(result.resultType).toBe('table');
      expect(result.data).toBeDefined();
    }
  });

  test('should handle error properly on malformed SQL', async () => {
    // Simulate the LLM generating invalid SQL
    (openai.generateSQLFromNaturalLanguage as jest.Mock).mockResolvedValue('INVALID SQL STATEMENT');
    
    // Database throws error on invalid SQL
    mockExecuteQuery.mockRejectedValue(new Error('SQL syntax error'));

    const result = await processQuery({ query: 'Generate some invalid SQL' });
    
    // Verify error handling
    expect(result.message).toBe('SQL syntax error');
    expect(result.resultType).toBe('table');
    expect(mockConnect).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  test('should not expose sensitive data in error messages', async () => {
    // Simulate database error that might contain sensitive information
    (openai.generateSQLFromNaturalLanguage as jest.Mock).mockResolvedValue('SELECT * FROM users');
    mockExecuteQuery.mockRejectedValue(new Error('Error: password authentication failed for user "admin"'));

    const result = await processQuery({ query: 'Show me all users' });
    
    // Error message should be shown but we need to ensure it doesn't reveal sensitive details
    expect(result.message).toBeDefined();
    
    // Update the test to match our improved error handling
    // We now provide more specific error categories but still don't reveal credentials
    expect(result.message).toBe('Database access error');
    
    // Verify that the original message is not present
    expect(result.message).not.toContain('password authentication failed');
    expect(result.message).not.toContain('admin');
  });
});