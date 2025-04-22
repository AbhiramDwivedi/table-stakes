import { processQuery, QueryRequest } from '../../lib/query-processor';
import { createDatabaseConnector } from '../../lib/database/factory';
import { generateSQLFromNaturalLanguage, determineResultType, generateVisualizationFromData } from '../../lib/openai';
import { formatForTable } from '../../lib/result-formatter';

// Mock our dependencies
jest.mock('../../lib/database/factory');
jest.mock('../../lib/openai');
jest.mock('../../lib/result-formatter');

describe('processQuery', () => {
  // Create mock implementations and reset them before each test
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock database connector
    const mockDb = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getSchema: jest.fn().mockResolvedValue({
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', dataType: 'integer' },
              { name: 'name', dataType: 'text' },
              { name: 'email', dataType: 'text' }
            ]
          }
        ]
      }),
      executeQuery: jest.fn().mockResolvedValue({
        columns: ['id', 'name', 'email'],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ]
      })
    };
    (createDatabaseConnector as jest.Mock).mockReturnValue(mockDb);

    // Mock OpenAI functions
    (generateSQLFromNaturalLanguage as jest.Mock).mockResolvedValue('SELECT * FROM users');
    (determineResultType as jest.Mock).mockReturnValue('table');
    (generateVisualizationFromData as jest.Mock).mockResolvedValue({
      chartType: 'bar',
      title: 'User Data',
      xAxis: 'name',
      yAxis: 'count',
      series: [],
      processedData: []
    });

    // Mock result formatters
    (formatForTable as jest.Mock).mockReturnValue({
      headers: ['id', 'name', 'email'],
      rows: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ]
    });
  });

  it('processes a standard table query successfully', async () => {
    // Arrange
    const request: QueryRequest = { query: 'List all users' };

    // Act
    const result = await processQuery(request);

    // Assert
    expect(createDatabaseConnector).toHaveBeenCalled();
    expect(determineResultType).toHaveBeenCalledWith('List all users');
    expect(generateSQLFromNaturalLanguage).toHaveBeenCalled();
    expect(formatForTable).toHaveBeenCalled();

    expect(result).toEqual({
      resultType: 'table',
      data: {
        headers: ['id', 'name', 'email'],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ]
      },
      sql: 'SELECT * FROM users',
      debug: {
        executedQuery: 'SELECT * FROM users',
        rowCount: 2
      }
    });
  });

  it('processes a graph visualization query successfully', async () => {
    // Arrange
    const request: QueryRequest = { query: 'Show a chart of users over time' };
    
    // Update the mock to return 'graph' for this test
    (determineResultType as jest.Mock).mockReturnValue('graph');

    // Act
    const result = await processQuery(request);

    // Assert
    expect(determineResultType).toHaveBeenCalledWith('Show a chart of users over time');
    expect(generateVisualizationFromData).toHaveBeenCalled();
    expect(formatForTable).not.toHaveBeenCalled();

    expect(result).toEqual({
      resultType: 'graph',
      data: {
        chartType: 'bar',
        title: 'User Data',
        xAxis: 'name',
        yAxis: 'count',
        series: [],
        processedData: []
      },
      sql: 'SELECT * FROM users',
      debug: {
        executedQuery: 'SELECT * FROM users',
        rowCount: 2
      }
    });
  });

  it('handles database connection errors gracefully', async () => {
    // Arrange
    const request: QueryRequest = { query: 'List all users' };
    
    const mockDb = {
      connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(false)
    };
    (createDatabaseConnector as jest.Mock).mockReturnValue(mockDb);

    // Act
    const result = await processQuery(request);

    // Assert
    expect(mockDb.connect).toHaveBeenCalled();
    expect(mockDb.disconnect).not.toHaveBeenCalled(); // Should not be called since it was never connected
    
    expect(result).toEqual({
      resultType: 'table',
      data: {},
      message: 'Database query failed',
      debug: {
        executedQuery: 'Error executing query',
        rowCount: 0
      }
    });
  });

  it('handles SQL syntax errors with appropriate messages', async () => {
    // Arrange
    const request: QueryRequest = { query: 'Invalid query syntax' };
    
    const mockDb = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getSchema: jest.fn().mockResolvedValue({
        tables: [{ name: 'users', columns: [] }]
      }),
      executeQuery: jest.fn().mockRejectedValue(new Error('syntax error in SQL statement'))
    };
    (createDatabaseConnector as jest.Mock).mockReturnValue(mockDb);

    // Act
    const result = await processQuery(request);

    // Assert
    expect(mockDb.connect).toHaveBeenCalled();
    expect(mockDb.isConnected).toHaveBeenCalled();
    expect(mockDb.disconnect).toHaveBeenCalled();
    
    expect(result).toEqual({
      resultType: 'table',
      data: {},
      message: 'SQL syntax error',
      debug: {
        executedQuery: 'Error executing query',
        rowCount: 0
      }
    });
  });

  it('handles missing table errors with appropriate messages', async () => {
    // Arrange
    const request: QueryRequest = { query: 'Query missing table' };
    
    const mockDb = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getSchema: jest.fn().mockResolvedValue({
        tables: [{ name: 'users', columns: [] }]
      }),
      executeQuery: jest.fn().mockRejectedValue(new Error('relation "missing_table" does not exist'))
    };
    (createDatabaseConnector as jest.Mock).mockReturnValue(mockDb);

    // Act
    const result = await processQuery(request);

    // Assert
    expect(result.message).toBe('Requested table does not exist');
  });

  it('handles missing column errors with appropriate messages', async () => {
    // Arrange
    const request: QueryRequest = { query: 'Query with missing column' };
    
    const mockDb = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getSchema: jest.fn().mockResolvedValue({
        tables: [{ name: 'users', columns: [] }]
      }),
      executeQuery: jest.fn().mockRejectedValue(new Error('column "missing_column" does not exist'))
    };
    (createDatabaseConnector as jest.Mock).mockReturnValue(mockDb);

    // Act
    const result = await processQuery(request);

    // Assert
    expect(result.message).toBe('Requested column does not exist');
  });

  it('always disconnects from database in the finally block', async () => {
    // Arrange
    const request: QueryRequest = { query: 'Query that will succeed' };
    
    const mockDb = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getSchema: jest.fn().mockResolvedValue({
        tables: [{ name: 'users', columns: [] }]
      }),
      executeQuery: jest.fn().mockResolvedValue({
        columns: ['id'],
        rows: [{ id: 1 }]
      })
    };
    (createDatabaseConnector as jest.Mock).mockReturnValue(mockDb);

    // Act
    await processQuery(request);

    // Assert
    expect(mockDb.isConnected).toHaveBeenCalled();
    expect(mockDb.disconnect).toHaveBeenCalled();
  });
});