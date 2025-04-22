// Mock Next.js server components before imports
jest.mock('next/server', () => {
  return {
    NextRequest: jest.fn().mockImplementation((url, options = {}) => {
      return {
        url,
        method: options.method || 'GET',
        headers: new Map(Object.entries(options.headers || {})),
        json: jest.fn().mockImplementation(async () => {
          return options.body ? JSON.parse(options.body) : {};
        })
      };
    }),
    NextResponse: {
      json: jest.fn().mockImplementation((data, options) => ({
        data,
        options,
        headers: new Map()
      }))
    }
  };
});

import { POST } from '@/app/api/query/route';
import { processQuery } from '@/lib/query-processor';
import { verifyCSRFToken } from '@/lib/csrf-protection';

// Mock dependencies
jest.mock('@/lib/query-processor');
jest.mock('@/lib/csrf-protection');

describe('Query API Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementation for verifyCSRFToken
    (verifyCSRFToken as jest.Mock).mockReturnValue(true);
    
    // Set up default mock implementation for processQuery
    (processQuery as jest.Mock).mockResolvedValue({
      result: 'success',
      data: [{ id: 1, name: 'Test' }]
    });
  });

  test('returns 403 if CSRF token is missing', async () => {
    // Create request without CSRF token
    const request = new (jest.requireMock('next/server').NextRequest)(
      'http://localhost/api/query',
      {
        method: 'POST',
        body: JSON.stringify({ query: 'Show me all users' })
      }
    );
    
    // Call the API route handler
    await POST(request);
    
    // Verify response
    const jsonMock = jest.requireMock('next/server').NextResponse.json;
    expect(jsonMock).toHaveBeenCalledWith(
      { message: 'Invalid or missing CSRF token' },
      { status: 403 }
    );
  });

  test('returns 403 if CSRF token is invalid', async () => {
    // Mock verifyCSRFToken to return false
    (verifyCSRFToken as jest.Mock).mockReturnValue(false);
    
    // Create request with invalid CSRF token
    const request = new (jest.requireMock('next/server').NextRequest)(
      'http://localhost/api/query',
      {
        method: 'POST',
        headers: {
          'x-csrf-token': 'invalid-token'
        },
        body: JSON.stringify({ query: 'Show me all users' })
      }
    );
    
    // Call the API route handler
    await POST(request);
    
    // Verify response
    const jsonMock = jest.requireMock('next/server').NextResponse.json;
    expect(jsonMock).toHaveBeenCalledWith(
      { message: 'Invalid or missing CSRF token' },
      { status: 403 }
    );
  });

  test('processes valid query request and returns results', async () => {
    // Create a request with valid CSRF token
    const request = new (jest.requireMock('next/server').NextRequest)(
      'http://localhost/api/query',
      {
        method: 'POST',
        headers: {
          'x-csrf-token': 'valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ 
          query: 'Show me all users',
          data_source: 'default'
        })
      }
    );
    
    // Call the API route handler
    await POST(request);
    
    // Verify that processQuery was called with the right parameters
    expect(processQuery).toHaveBeenCalledWith({
      query: 'Show me all users',
      dataSource: 'default'
    });
    
    // Verify that response contains the expected data
    const jsonMock = jest.requireMock('next/server').NextResponse.json;
    expect(jsonMock).toHaveBeenCalledWith({
      result: 'success',
      data: [{ id: 1, name: 'Test' }]
    });
  });

  test('handles errors during processing and returns 500 response', async () => {
    // Mock processQuery to throw an error
    const mockError = new Error('Query processing failed');
    (processQuery as jest.Mock).mockRejectedValueOnce(mockError);
    
    // Create a request with valid CSRF token
    const request = new (jest.requireMock('next/server').NextRequest)(
      'http://localhost/api/query',
      {
        method: 'POST',
        headers: {
          'x-csrf-token': 'valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ query: 'Show me all users' })
      }
    );
    
    // Spy on console.error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Call the API route handler
    await POST(request);
    
    // Verify that error was logged
    expect(errorSpy).toHaveBeenCalled();
    
    // Verify response
    const jsonMock = jest.requireMock('next/server').NextResponse.json;
    expect(jsonMock).toHaveBeenCalledWith(
      { error: 'Query processing failed' },
      { status: 500 }
    );
    
    // Restore console.error
    errorSpy.mockRestore();
  });

  test('handles unexpected errors with generic message', async () => {
    // Mock processQuery to throw a non-Error object
    (processQuery as jest.Mock).mockRejectedValueOnce('Unexpected failure');
    
    // Create a request with valid CSRF token
    const request = new (jest.requireMock('next/server').NextRequest)(
      'http://localhost/api/query',
      {
        method: 'POST',
        headers: {
          'x-csrf-token': 'valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ query: 'Show me all users' })
      }
    );
    
    // Spy on console.error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Call the API route handler
    await POST(request);
    
    // Verify response with generic error message
    const jsonMock = jest.requireMock('next/server').NextResponse.json;
    expect(jsonMock).toHaveBeenCalledWith(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
    
    // Restore console.error
    errorSpy.mockRestore();
  });
});