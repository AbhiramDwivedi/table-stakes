import { Pool, type PoolClient } from "pg"
import {
  type DatabaseConnector,
  type DatabaseSchema,
  type TableSchema,
  type ColumnSchema,
  type QueryResult,
  type DatabaseConfig,
  DatabaseError,
  QueryError,
} from "./interface"

export class PostgreSQLConnector implements DatabaseConnector {
  private pool: Pool
  private client: PoolClient | null = null

  constructor(private config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
    })
  }

  async connect(): Promise<void> {
    try {
      this.client = await this.pool.connect()
    } catch (error) {
      throw new DatabaseError(
        `Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release()
      this.client = null
    }
    await this.pool.end()
  }

  isConnected(): boolean {
    return this.client !== null
  }

  async getSchema(): Promise<DatabaseSchema> {
    if (!this.client) {
      await this.connect()
    }

    try {
      // Get all tables in the public schema
      const tablesResult = await this.client!.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)

      const tables: TableSchema[] = []

      // For each table, get its columns
      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name

        const columnsResult = await this.client!.query(
          `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
        `,
          [tableName],
        )

        const columns: ColumnSchema[] = columnsResult.rows.map((row) => ({
          name: row.column_name,
          dataType: row.data_type,
        }))

        tables.push({
          name: tableName,
          columns,
        })
      }

      return { tables }
    } catch (error) {
      throw new DatabaseError(`Failed to get schema: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async executeQuery(sql: string): Promise<QueryResult> {
    if (!this.client) {
      await this.connect()
    }

    try {
      const result = await this.client!.query(sql)

      // For SELECT queries
      if (result.rows) {
        return {
          columns: result.fields.map((field) => field.name),
          rows: result.rows,
        }
      }

      // For non-SELECT queries (INSERT, UPDATE, DELETE)
      return {
        columns: [],
        rows: [{ affectedRows: result.rowCount }],
      }
    } catch (error) {
      throw new QueryError(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
