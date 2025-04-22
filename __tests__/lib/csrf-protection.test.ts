import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie, verifyCSRFToken } from '@/lib/csrf-protection';
import { createMocks } from 'node-mocks-http';

// Directly mock Next.js server components without requireActual
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn().mockReturnValue({
      cookies: {
        set: jest.fn(),
      },
    }),
  },
}));

describe('CSRF Protection', () => {
  describe('generateCSRFToken', () => {
    test('should generate a random string with correct length', () => {
      const token = generateCSRFToken();
      
      // The output of randomBytes(32).toString('hex') will be 64 characters
      expect(token).toHaveLength(64);
      
      // Tokens should be different on each call
      const token2 = generateCSRFToken();
      expect(token).not.toBe(token2);
    });
  });

  describe('setCSRFCookie', () => {
    test('should set a CSRF token cookie if not already present', () => {
      // Create a mock request with no CSRF cookie
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      };
      
      const mockResponse = {
        cookies: {
          set: jest.fn(),
        },
      };
      
      // Mock NextResponse.next to return our mock response
      const nextResponseMock = jest.requireMock('next/server').NextResponse;
      nextResponseMock.next.mockReturnValue(mockResponse);
      
      // Call the function
      const result = setCSRFCookie(mockRequest as any);
      
      // Verify the cookie was set
      expect(result.cookies.set).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
    });

    test('should not set a cookie if one already exists', () => {
      // Create a mock request with existing CSRF cookie
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'csrf_token', value: 'existing-token' }),
        },
      };
      
      const mockResponse = {
        cookies: {
          set: jest.fn(),
        },
      };
      
      // Mock NextResponse.next
      const nextResponseMock = jest.requireMock('next/server').NextResponse;
      nextResponseMock.next.mockReturnValue(mockResponse);
      
      // Call the function
      const result = setCSRFCookie(mockRequest as any);
      
      // Verify no new cookie was set
      expect(result.cookies.set).not.toHaveBeenCalled();
    });
  });

  describe('verifyCSRFToken', () => {
    test('should return true if token matches cookie', () => {
      // Create a mock request with CSRF cookie
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'matching-token' }),
        },
      };
      
      // Call the function with matching token
      const result = verifyCSRFToken(mockRequest as any, 'matching-token');
      
      // Verify the result
      expect(result).toBe(true);
    });

    test('should return false if token does not match cookie', () => {
      // Create a mock request with CSRF cookie
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'cookie-token' }),
        },
      };
      
      // Call the function with non-matching token
      const result = verifyCSRFToken(mockRequest as any, 'different-token');
      
      // Verify the result
      expect(result).toBe(false);
    });

    test('should return false if cookie is missing', () => {
      // Create a mock request with no CSRF cookie
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      };
      
      // Call the function
      const result = verifyCSRFToken(mockRequest as any, 'some-token');
      
      // Verify the result
      expect(result).toBe(false);
    });

    test('should return false if token parameter is missing', () => {
      // Create a mock request with CSRF cookie
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'cookie-token' }),
        },
      };
      
      // Call the function with undefined token
      const result = verifyCSRFToken(mockRequest as any, undefined as any);
      
      // Verify the result
      expect(result).toBe(false);
    });
  });
});