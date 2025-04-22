import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Middleware to set CSRF token cookie
 */
export function setCSRFCookie(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Check if the CSRF cookie is already set
  const csrfCookie = request.cookies.get('csrf_token');
  
  if (!csrfCookie) {
    // Generate a new CSRF token
    const csrfToken = generateCSRFToken();
    
    // Set the CSRF token as a cookie
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600 // 1 hour
    });
  }
  
  return response;
}

/**
 * Verify CSRF token in a request
 * @param request The incoming request
 * @param csrfToken The token from the request body or header
 */
export function verifyCSRFToken(request: NextRequest, csrfToken: string): boolean {
  const csrfCookie = request.cookies.get('csrf_token');
  
  if (!csrfCookie || !csrfToken) {
    return false;
  }
  
  // Compare the token from the cookie with the token from the request
  return csrfCookie.value === csrfToken;
}