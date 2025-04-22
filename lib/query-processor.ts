import { createDatabaseConnector } from "./database/factory"
import { generateSQLFromNaturalLanguage, determineResultType, enhanceGraphData, generateVisualizationFromData } from "./openai"
import { formatForTable, formatForGraph } from "./result-formatter"

export interface QueryRequest {
  query: string
  dataSource?: string
}

export interface QueryResponse {
  resultType: "table" | "graph"
  data: any
  sql?: string
  message?: string
  debug?: {
    executedQuery: string
    rowCount: number
  }
}

export async function processQuery(request: QueryRequest): Promise<QueryResponse> {
  const { query } = request
  console.log(`Processing query: "${query}"`)

  // Create database connector
  const db = createDatabaseConnector()

  try {
    // Connect to the database
    await db.connect()

    // Get database schema
    const schema = await db.getSchema()
    console.log(`Retrieved schema with ${schema.tables.length} tables`)

    // Determine result type (table or graph)
    const resultType = determineResultType(query)
    console.log(`Determined result type: ${resultType}`)

    // Generate SQL from natural language
    const sql = await generateSQLFromNaturalLanguage(query, schema)
    console.log(`Generated SQL: ${sql}`)

    // Execute the SQL query
    const queryResult = await db.executeQuery(sql)
    console.log(`Query executed with ${queryResult.rows.length} results`)

    // Format the result based on the result type
    let formattedResult
    if (resultType === "graph") {
      console.log(`Generating graph visualization for query: "${query}"`)
      // Pass the raw query results to the LLM for visualization generation
      formattedResult = await generateVisualizationFromData(query, queryResult)
      console.log(`LLM generated visualization data with chart type: ${formattedResult.chartType}`)
    } else {
      formattedResult = formatForTable(queryResult)
    }

    return {
      resultType,
      data: formattedResult,
      sql,
      debug: {
        executedQuery: sql,
        rowCount: queryResult.rows.length
      }
    }
  } catch (error) {
    console.error("Error in processQuery:", error)
    
    // Sanitize error messages to prevent leaking sensitive information
    let errorMessage = "Database query failed";
    
    // For specific error types, provide more helpful but still safe messages
    // without leaking connection details, usernames, passwords, etc.
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes("syntax error")) {
      errorMessage = "SQL syntax error";
    } else if (errorStr.includes("permission denied") || errorStr.includes("authentication failed")) {
      errorMessage = "Database access error";
    } else if (errorStr.includes("timeout")) {
      errorMessage = "Database query timeout";
    } else if (errorStr.includes("relation") && errorStr.includes("does not exist")) {
      errorMessage = "Requested table does not exist";
    } else if (errorStr.includes("column") && errorStr.includes("does not exist")) {
      errorMessage = "Requested column does not exist";
    }
    
    // Log original error for debugging but never expose to user
    console.log(`Original error (not exposed to user): ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      resultType: "table",
      data: {},
      message: errorMessage,
      debug: {
        executedQuery: "Error executing query",
        rowCount: 0
      }
    }
  } finally {
    // Disconnect from the database
    if (db.isConnected()) {
      await db.disconnect()
    }
  }
}
