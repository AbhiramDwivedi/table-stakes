import type { QueryResult } from "./database/interface"

export interface TableResult {
  columns: string[]
  rows: Record<string, any>[]
}

export interface SeriesConfig {
  dataKey: string
  name: string
  color: string
  type?: string
}

export interface GraphResult {
  chartType: string  // "bar", "line", "pie", "scatter", "area", "composed", etc.
  title: string
  subtitle?: string
  xAxis: string
  yAxis: string
  xAxisKey?: string
  labels?: string[]
  values?: number[]
  series?: SeriesConfig[]
  processedData?: any[]
  rawData?: Record<string, any>[]
  insights?: string
  recommendedFilters?: string[]
  imageUrl?: string
  analysis?: string
}

export function formatForTable(queryResult: QueryResult): TableResult {
  return {
    columns: queryResult.columns,
    rows: queryResult.rows,
  }
}

// Note: The formatForGraph function is no longer needed as we're using
// the LLM to handle the data processing and transformation directly.
// The original implementation is kept for reference but will not be used.
export function formatForGraph(queryResult: QueryResult): GraphResult {
  // ... existing code ...
}
