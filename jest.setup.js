// Optional: Configure or set up a testing framework before each test.
import '@testing-library/jest-dom';

// Add the OpenAI Node.js shim for fetch API
import 'openai/shims/node';

// Import OS detection and path utilities
import { OS_TYPE, normalizePath, buildPath } from './lib/utils/path-utils';

// Make OS_TYPE available globally for tests
global.OS_TYPE = OS_TYPE;

// Import path module to handle cross-platform file paths
import path from 'path';

// Add TextEncoder/TextDecoder polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// https://github.com/jsdom/jsdom/issues/3203
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    route: '/',
    asPath: '/',
    query: {},
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

// Helper function to normalize file paths across different operating systems
global.normalizePath = normalizePath;

// Helper function to construct platform-specific file paths
global.buildPath = buildPath;