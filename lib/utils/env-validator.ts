/**
 * Utility to validate and protect environment variables
 */

/**
 * Safely retrieve an environment variable
 * @param key The environment variable name
 * @param defaultValue Optional default value if not found
 * @returns The environment variable value or default
 */
export function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * Validate that required environment variables are set
 * @param requiredVars Array of required environment variable names
 * @throws Error if any required variable is missing
 */
export function validateEnvVariables(requiredVars: string[]): void {
  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Obfuscate sensitive data like API keys for logging
 * @param value String value to obfuscate
 * @returns Obfuscated string
 */
export function obfuscateSensitiveData(value: string): string {
  if (!value) return '';
  
  // Show first 4 and last 4 characters only if string is long enough
  if (value.length > 8) {
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }
  
  // For shorter strings, just show first 2 chars
  return `${value.substring(0, 2)}...`;
}

/**
 * Safely access API keys without exposing them
 * @param keyName Name of the API key environment variable
 * @returns The API key value or throws if missing
 */
export function getApiKey(keyName: string): string {
  const apiKey = getEnvVariable(keyName);
  
  // Log that the key was accessed but never log the actual value
  console.log(`API key '${keyName}' was accessed (${obfuscateSensitiveData(apiKey)})`);
  
  return apiKey;
}