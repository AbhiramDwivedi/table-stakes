import type { DatabaseConnector, DatabaseConfig } from "./interface"
import { PostgreSQLConnector } from "./postgresql"

// Add more database implementations as needed
// import { MySQLConnector } from './mysql';
// import { SQLiteConnector } from './sqlite';

export function createDatabaseConnector(): DatabaseConnector {
  const databaseType = process.env.DATABASE_TYPE || "postgresql"
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  const config: DatabaseConfig = {
    connectionString,
  }

  switch (databaseType.toLowerCase()) {
    case "postgresql":
      return new PostgreSQLConnector(config)
    // Add more database types as needed
    // case 'mysql':
    //   return new MySQLConnector(config);
    // case 'sqlite':
    //   return new SQLiteConnector(config);
    default:
      throw new Error(`Unsupported database type: ${databaseType}`)
  }
}
