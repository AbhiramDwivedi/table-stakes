import { determineResultType } from '@/lib/openai';

describe('Result Type Determination', () => {
  test('returns "graph" for queries with visualization keywords', () => {
    const graphQueries = [
      'Show me a trend of user signups',
      'Give me a graph of monthly sales',
      'Plot the distribution of ages',
      'Show a bar chart of product categories',
      'Compare sales across regions',
      'Show me week by week enrollment data',
      'Create a visualization of quarterly results'
    ];
    
    graphQueries.forEach(query => {
      expect(determineResultType(query)).toBe('graph');
    });
  });
  
  test('returns "table" for standard queries', () => {
    const tableQueries = [
      'Show me all users',
      'List products',
      'Find orders with status pending',
      'Show transactions from yesterday',
      'Select all employees',
      'Display active accounts',
      'Find customers from New York'
    ];
    
    tableQueries.forEach(query => {
      expect(determineResultType(query)).toBe('table');
    });
  });
  
  test('is case insensitive when checking for keywords', () => {
    const mixedCaseQueries = [
      'show me a GRAPH of user signups',
      'Create a BAR CHART of sales',
      'Generate a TREND analysis',
      'COMPARE the performance metrics'
    ];
    
    mixedCaseQueries.forEach(query => {
      expect(determineResultType(query)).toBe('graph');
    });
  });
});