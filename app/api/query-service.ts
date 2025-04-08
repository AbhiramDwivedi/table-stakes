// API service for the Data Query Assistant

export interface QueryRequest {
  query: string
  dataSource?: string
}

export interface QueryResponse {
  resultType: "table" | "graph"
  data: any
  sql?: string
  message?: string
}

export async function executeQuery(request: QueryRequest): Promise<QueryResponse> {
  try {
    const response = await fetch("/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: request.query,
        data_source: request.dataSource || "postgresql",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to execute query")
    }

    return await response.json()
  } catch (error) {
    console.error("Error executing query:", error)
    throw error
  }
}
