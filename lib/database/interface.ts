/**
 * Database interface for the Data Query Assistant
 * This allows for easy extension to other database types
 */

export interface DatabaseSchema {
  tables: TableSchema[]
}

export interface TableSchema {
  name: string
  columns: ColumnSchema[]
}

export interface ColumnSchema {
  name: string
  dataType: string
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, any>[]
}

export interface DatabaseConnector {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getSchema(): Promise<DatabaseSchema>
  executeQuery(sql: string): Promise<QueryResult>
  isConnected(): boolean
}

export interface DatabaseConfig {
  connectionString: string
  // Add other common configuration options here
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseError"
  }
}

export class QueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QueryError"
  }
}
