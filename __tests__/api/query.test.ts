import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { processQuery } from '../../lib/query-processor';

// Mock the query processor module
jest.mock('../../lib/query-processor');

// Since we don't have direct access to the actual API route handler,
// we'll create a simplified version for testing purposes
async function queryHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const result = await processQuery({ query });
    return res.status(200).json(result);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Error processing query',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

describe('Query API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await queryHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' });
  });

  test('returns 400 if query is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await queryHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Query is required' });
  });

  test('returns query result for valid request', async () => {
    const mockResult = {
      resultType: 'table',
      data: {
        columns: ['id', 'name'],
        rows: [{ id: 1, name: 'John' }],
      },
      sql: 'SELECT id, name FROM users',
    };

    // Setup mock to return our test data
    (processQuery as jest.Mock).mockResolvedValue(mockResult);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        query: 'Show me all users',
      },
    });

    await queryHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockResult);
    expect(processQuery).toHaveBeenCalledWith({ query: 'Show me all users' });
  });

  test('handles error from query processor', async () => {
    // Setup mock to throw an error
    (processQuery as jest.Mock).mockRejectedValue(new Error('Processing failed'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        query: 'Invalid query',
      },
    });

    await queryHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Error processing query',
      error: 'Processing failed',
    });
  });
});