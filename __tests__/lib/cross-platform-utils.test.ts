// Mock the os module before importing any modules
jest.mock('os', () => ({
  platform: jest.fn().mockReturnValue('win32'),
  homedir: jest.fn().mockReturnValue('C:\\Users\\testuser'),
  EOL: '\n',
}));

import * as os from 'os';
import path from 'path';

// We need to import the path-utils module after setting up the mocks
describe('Path Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('OS_TYPE', () => {
    test('correctly identifies Windows', () => {
      // Set up the mock for Windows
      (os.platform as jest.Mock).mockReturnValue('win32');
      jest.resetModules();
      const { OS_TYPE } = require('@/lib/utils/path-utils');
      
      expect(OS_TYPE.IS_WINDOWS).toBe(true);
      expect(OS_TYPE.IS_MAC).toBe(false);
      expect(OS_TYPE.IS_LINUX).toBe(false);
      expect(OS_TYPE.PLATFORM).toBe('win32');
    });

    test('correctly identifies macOS', () => {
      // Set up the mock for macOS
      (os.platform as jest.Mock).mockReturnValue('darwin');
      jest.resetModules();
      const { OS_TYPE } = require('@/lib/utils/path-utils');
      
      expect(OS_TYPE.IS_WINDOWS).toBe(false);
      expect(OS_TYPE.IS_MAC).toBe(true);
      expect(OS_TYPE.IS_LINUX).toBe(false);
      expect(OS_TYPE.PLATFORM).toBe('darwin');
    });

    test('correctly identifies Linux', () => {
      // Set up the mock for Linux
      (os.platform as jest.Mock).mockReturnValue('linux');
      jest.resetModules();
      const { OS_TYPE } = require('@/lib/utils/path-utils');
      
      expect(OS_TYPE.IS_WINDOWS).toBe(false);
      expect(OS_TYPE.IS_MAC).toBe(false);
      expect(OS_TYPE.IS_LINUX).toBe(true);
      expect(OS_TYPE.PLATFORM).toBe('linux');
    });
  });

  describe('normalizePath', () => {
    test('normalizes forward slashes to platform-specific separator', () => {
      const { normalizePath } = require('@/lib/utils/path-utils');
      const input = 'path/to/file.txt';
      const expected = `path${path.sep}to${path.sep}file.txt`;
      expect(normalizePath(input)).toBe(expected);
    });

    test('normalizes backslashes to platform-specific separator', () => {
      const { normalizePath } = require('@/lib/utils/path-utils');
      const input = 'path\\to\\file.txt';
      const expected = `path${path.sep}to${path.sep}file.txt`;
      expect(normalizePath(input)).toBe(expected);
    });

    test('normalizes mixed slashes to platform-specific separator', () => {
      const { normalizePath } = require('@/lib/utils/path-utils');
      const input = 'path/to\\file.txt';
      const expected = `path${path.sep}to${path.sep}file.txt`;
      expect(normalizePath(input)).toBe(expected);
    });
  });

  describe('buildPath', () => {
    test('joins path segments correctly', () => {
      const { buildPath } = require('@/lib/utils/path-utils');
      const segments = ['path', 'to', 'file.txt'];
      const expected = `path${path.sep}to${path.sep}file.txt`;
      expect(buildPath(...segments)).toBe(expected);
    });

    test('handles empty segments', () => {
      const { buildPath } = require('@/lib/utils/path-utils');
      const segments = ['path', '', 'file.txt'];
      const expected = `path${path.sep}file.txt`;
      expect(buildPath(...segments)).toBe(expected);
    });
  });

  describe('getTempDirectory', () => {
    test('returns Windows temp directory when on Windows with TEMP env var', () => {
      // Set up the mock for Windows with TEMP
      (os.platform as jest.Mock).mockReturnValue('win32');
      process.env.TEMP = 'D:\\CustomTemp';
      jest.resetModules();
      const { getTempDirectory } = require('@/lib/utils/path-utils');
      
      expect(getTempDirectory()).toBe('D:\\CustomTemp');
    });

    test('returns Windows default temp directory when on Windows without TEMP env var', () => {
      // Set up the mock for Windows without TEMP
      (os.platform as jest.Mock).mockReturnValue('win32');
      const originalTemp = process.env.TEMP;
      delete process.env.TEMP;
      jest.resetModules();
      const { getTempDirectory } = require('@/lib/utils/path-utils');
      
      expect(getTempDirectory()).toBe('C:\\Windows\\Temp');
      
      // Restore the TEMP env var
      process.env.TEMP = originalTemp;
    });

    test('returns Unix temp directory when on non-Windows', () => {
      // Set up the mock for macOS
      (os.platform as jest.Mock).mockReturnValue('darwin');
      jest.resetModules();
      const { getTempDirectory } = require('@/lib/utils/path-utils');
      expect(getTempDirectory()).toBe('/tmp');
      
      // Set up the mock for Linux
      (os.platform as jest.Mock).mockReturnValue('linux');
      jest.resetModules();
      const { getTempDirectory: getTempDirectoryLinux } = require('@/lib/utils/path-utils');
      expect(getTempDirectoryLinux()).toBe('/tmp');
    });
  });

  describe('getTestDataDir', () => {
    test('returns correct Windows test data directory', () => {
      // Set up the mock for Windows
      (os.platform as jest.Mock).mockReturnValue('win32');
      jest.resetModules();
      const { getTestDataDir } = require('@/lib/utils/path-utils');
      const expected = path.join(process.cwd(), 'test-data');
      
      expect(getTestDataDir()).toBe(expected);
    });

    test('returns correct Windows test data directory with relative path', () => {
      // Set up the mock for Windows
      (os.platform as jest.Mock).mockReturnValue('win32');
      jest.resetModules();
      const { getTestDataDir } = require('@/lib/utils/path-utils');
      const relativePath = 'subfolder';
      const expected = path.join(process.cwd(), 'test-data', relativePath);
      
      expect(getTestDataDir(relativePath)).toBe(expected);
    });

    test('returns correct macOS test data directory', () => {
      // Set up the mock for macOS
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (os.homedir as jest.Mock).mockReturnValue('/Users/testuser');
      jest.resetModules();
      const { getTestDataDir } = require('@/lib/utils/path-utils');
      
      const expected = '/Users/testuser/test-data';
      expect(getTestDataDir()).toBe(expected);
    });

    test('returns correct Linux test data directory', () => {
      // Set up the mock for Linux
      (os.platform as jest.Mock).mockReturnValue('linux');
      jest.resetModules();
      const { getTestDataDir } = require('@/lib/utils/path-utils');
      
      const expected = '/tmp/test-data';
      expect(getTestDataDir()).toBe(expected);
    });

    test('appends relative path correctly on all platforms', () => {
      const relativePath = 'subfolder';
      
      // Windows
      (os.platform as jest.Mock).mockReturnValue('win32');
      jest.resetModules();
      const { getTestDataDir: getTestDataDirWin } = require('@/lib/utils/path-utils');
      let expected = path.join(process.cwd(), 'test-data', relativePath);
      expect(getTestDataDirWin(relativePath)).toBe(expected);
      
      // macOS
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (os.homedir as jest.Mock).mockReturnValue('/Users/testuser');
      jest.resetModules();
      const { getTestDataDir: getTestDataDirMac } = require('@/lib/utils/path-utils');
      expected = '/Users/testuser/test-data/subfolder';
      expect(getTestDataDirMac(relativePath)).toBe(expected);
      
      // Linux
      (os.platform as jest.Mock).mockReturnValue('linux');
      jest.resetModules();
      const { getTestDataDir: getTestDataDirLinux } = require('@/lib/utils/path-utils');
      expected = '/tmp/test-data/subfolder';
      expect(getTestDataDirLinux(relativePath)).toBe(expected);
    });
  });

  describe('getOsSpecificCommand', () => {
    test('replaces forward slashes with backslashes on Windows', () => {
      // Set up the mock for Windows
      (os.platform as jest.Mock).mockReturnValue('win32');
      jest.resetModules();
      const { getOsSpecificCommand } = require('@/lib/utils/path-utils');
      const command = 'dir /path/to/folder';
      const expected = 'dir \\path\\to\\folder';
      
      expect(getOsSpecificCommand(command)).toBe(expected);
    });

    test('replaces backslashes with forward slashes on Unix-like systems', () => {
      // macOS
      (os.platform as jest.Mock).mockReturnValue('darwin');
      jest.resetModules();
      const { getOsSpecificCommand: getOsSpecificCommandMac } = require('@/lib/utils/path-utils');
      const command = 'ls C:\\path\\to\\folder';
      const expected = 'ls C:/path/to/folder';
      
      expect(getOsSpecificCommandMac(command)).toBe(expected);
      
      // Linux
      (os.platform as jest.Mock).mockReturnValue('linux');
      jest.resetModules();
      const { getOsSpecificCommand: getOsSpecificCommandLinux } = require('@/lib/utils/path-utils');
      expect(getOsSpecificCommandLinux(command)).toBe(expected);
    });
  });

  describe('getDefaultDatabasePath', () => {
    test('returns Windows database path when on Windows', () => {
      // Set up the mock for Windows
      (os.platform as jest.Mock).mockReturnValue('win32');
      jest.resetModules();
      const { getDefaultDatabasePath, normalizePath } = require('@/lib/utils/path-utils');
      
      const expected = 'C:\\data\\table-stakes\\database.sqlite';
      const result = getDefaultDatabasePath();
      
      // Normalize the path to handle platform-specific separators during test
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('returns macOS database path when on macOS', () => {
      // Set up the mock for macOS
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (os.homedir as jest.Mock).mockReturnValue('/Users/testuser');
      jest.resetModules();
      const { getDefaultDatabasePath, normalizePath } = require('@/lib/utils/path-utils');
      
      const expected = '/Users/testuser/Library/Application Support/table-stakes/database.sqlite';
      const result = getDefaultDatabasePath();
      
      // Normalize the path to handle platform-specific separators during test
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('returns Linux database path when on Linux', () => {
      // Set up the mock for Linux
      (os.platform as jest.Mock).mockReturnValue('linux');
      (os.homedir as jest.Mock).mockReturnValue('/home/testuser');
      jest.resetModules();
      const { getDefaultDatabasePath, normalizePath } = require('@/lib/utils/path-utils');
      
      const expected = '/home/testuser/.local/share/table-stakes/database.sqlite';
      const result = getDefaultDatabasePath();
      
      // Normalize the path to handle platform-specific separators during test
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });
  });
});