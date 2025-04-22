import { formatForTable, formatForGraph } from '../../lib/result-formatter';
import type { QueryResult } from '../../lib/database/interface';

describe('result-formatter', () => {
  describe('formatForTable', () => {
    it('formats query results for table display', () => {
      // Arrange
      const queryResult: QueryResult = {
        columns: ['id', 'name', 'email'],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ]
      };

      // Act
      const result = formatForTable(queryResult);

      // Assert
      expect(result).toEqual({
        columns: ['id', 'name', 'email'],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ]
      });
    });

    it('handles empty result sets correctly', () => {
      // Arrange
      const queryResult: QueryResult = {
        columns: ['id', 'name', 'email'],
        rows: []
      };

      // Act
      const result = formatForTable(queryResult);

      // Assert
      expect(result).toEqual({
        columns: ['id', 'name', 'email'],
        rows: []
      });
      expect(result.rows.length).toBe(0);
    });

    it('preserves all data types in the result', () => {
      // Arrange
      const queryResult: QueryResult = {
        columns: ['id', 'name', 'active', 'created_at', 'score', 'metadata'],
        rows: [
          { 
            id: 1, 
            name: 'Test User', 
            active: true, 
            created_at: new Date('2023-01-01'), 
            score: 95.5,
            metadata: { role: 'admin', preferences: { theme: 'dark' } }
          }
        ]
      };

      // Act
      const result = formatForTable(queryResult);

      // Assert
      expect(result.rows[0].id).toBe(1);
      expect(result.rows[0].name).toBe('Test User');
      expect(result.rows[0].active).toBe(true);
      expect(result.rows[0].created_at).toBeInstanceOf(Date);
      expect(result.rows[0].score).toBe(95.5);
      expect(result.rows[0].metadata.role).toBe('admin');
      expect(result.rows[0].metadata.preferences.theme).toBe('dark');
    });
  });

  // Even though formatForGraph is not actively used, we should still
  // test its current implementation to maintain coverage
  describe('formatForGraph', () => {
    it('exists as a function', () => {
      expect(typeof formatForGraph).toBe('function');
    });
  });
});