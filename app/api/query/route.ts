import { type NextRequest, NextResponse } from "next/server"
import { processQuery, type QueryRequest } from "@/lib/query-processor"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const queryRequest: QueryRequest = {
      query: body.query,
      dataSource: body.data_source,
    }

    const result = await processQuery(queryRequest)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing query:", error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}
