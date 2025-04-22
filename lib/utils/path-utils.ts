import path from 'path';
import os from 'os';

/**
 * Detect operating system type
 */
export const OS_TYPE = {
  IS_WINDOWS: os.platform() === 'win32',
  IS_MAC: os.platform() === 'darwin',
  IS_LINUX: os.platform() === 'linux',
  PLATFORM: os.platform(),
  EOL: os.EOL,
  PATH_SEP: path.sep,
  HOME_DIR: os.homedir()
};

/**
 * Normalize file paths to use the correct path separators for the current OS
 * @param filePath Path to normalize
 * @returns Normalized path
 */
export function normalizePath(filePath: string): string {
  return filePath.split(/[/\\]/).join(path.sep);
}

/**
 * Build a platform-specific file path from segments
 * @param segments Path segments to join
 * @returns Platform-specific file path
 */
export function buildPath(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Get the appropriate temporary directory for the current OS
 * @returns OS-specific temp directory path
 */
export function getTempDirectory(): string {
  if (OS_TYPE.IS_WINDOWS) {
    return process.env.TEMP || 'C:\\Windows\\Temp';
  } else {
    return '/tmp';
  }
}

/**
 * Get the appropriate test data directory for the current OS
 * @param relativePath Optional relative path to add to the test data directory
 * @returns Path to test data directory
 */
export function getTestDataDir(relativePath?: string): string {
  let baseDir: string;
  
  if (OS_TYPE.IS_WINDOWS) {
    baseDir = path.join(process.cwd(), 'test-data');
  } else if (OS_TYPE.IS_MAC) {
    baseDir = path.join(os.homedir(), 'test-data');
  } else { // Linux
    baseDir = '/tmp/test-data';
  }
  
  return relativePath ? path.join(baseDir, relativePath) : baseDir;
}

/**
 * Execute a command with OS-specific considerations
 * @param command Base command
 * @returns OS-adjusted command
 */
export function getOsSpecificCommand(command: string): string {
  if (OS_TYPE.IS_WINDOWS) {
    // Use cmd.exe syntax on Windows
    return command.replace(/\//g, '\\');
  } else {
    // Use bash syntax on Unix-like systems
    return command.replace(/\\/g, '/');
  }
}

/**
 * Get the default database path for the current OS
 */
export function getDefaultDatabasePath(): string {
  if (OS_TYPE.IS_WINDOWS) {
    return buildPath('C:', 'data', 'table-stakes', 'database.sqlite');
  } else if (OS_TYPE.IS_MAC) {
    return buildPath(OS_TYPE.HOME_DIR, 'Library', 'Application Support', 'table-stakes', 'database.sqlite');
  } else {
    return buildPath(OS_TYPE.HOME_DIR, '.local', 'share', 'table-stakes', 'database.sqlite');
  }
}