import { getEnvVariable, validateEnvVariables, obfuscateSensitiveData, getApiKey } from '@/lib/utils/env-validator';

describe('Environment Variable Validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a fresh copy of environment variables for each test
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('getEnvVariable', () => {
    test('should return the environment variable if it exists', () => {
      process.env.TEST_VAR = 'test-value';
      const value = getEnvVariable('TEST_VAR');
      expect(value).toBe('test-value');
    });

    test('should return the default value if provided and variable does not exist', () => {
      delete process.env.TEST_VAR;
      const value = getEnvVariable('TEST_VAR', 'default-value');
      expect(value).toBe('default-value');
    });

    test('should throw an error if variable does not exist and no default is provided', () => {
      delete process.env.TEST_VAR;
      expect(() => getEnvVariable('TEST_VAR')).toThrow('Required environment variable TEST_VAR is not set');
    });
  });

  describe('validateEnvVariables', () => {
    test('should not throw if all required variables are present', () => {
      process.env.VAR1 = 'value1';
      process.env.VAR2 = 'value2';
      
      expect(() => validateEnvVariables(['VAR1', 'VAR2'])).not.toThrow();
    });

    test('should throw if any required variable is missing', () => {
      process.env.VAR1 = 'value1';
      delete process.env.VAR2;
      
      expect(() => validateEnvVariables(['VAR1', 'VAR2'])).toThrow('Missing required environment variables: VAR2');
    });

    test('should list all missing variables in the error message', () => {
      delete process.env.VAR1;
      delete process.env.VAR2;
      
      expect(() => validateEnvVariables(['VAR1', 'VAR2'])).toThrow('Missing required environment variables: VAR1, VAR2');
    });
  });

  describe('obfuscateSensitiveData', () => {
    test('should obfuscate a long string correctly', () => {
      const result = obfuscateSensitiveData('abcdefghijklmnop');
      expect(result).toBe('abcd...mnop');
    });

    test('should obfuscate a short string correctly', () => {
      const result = obfuscateSensitiveData('abcd');
      expect(result).toBe('ab...');
    });

    test('should handle empty string', () => {
      const result = obfuscateSensitiveData('');
      expect(result).toBe('');
    });
  });

  describe('getApiKey', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    beforeEach(() => {
      consoleSpy.mockClear();
    });

    test('should retrieve API key and log obfuscated version', () => {
      process.env.TEST_API_KEY = '1234567890abcdef';
      const apiKey = getApiKey('TEST_API_KEY');
      
      expect(apiKey).toBe('1234567890abcdef');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API key \'TEST_API_KEY\' was accessed')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1234...cdef')
      );
    });

    test('should throw if API key is not set', () => {
      delete process.env.TEST_API_KEY;
      
      expect(() => getApiKey('TEST_API_KEY')).toThrow();
    });
  });
});