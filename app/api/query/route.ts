import { type NextRequest, NextResponse } from "next/server"
import { processQuery, type QueryRequest } from "@/lib/query-processor"
import { verifyCSRFToken } from '@/lib/csrf-protection';

export async function POST(request: NextRequest) {
  try {
    // Get the CSRF token from the request headers
    const csrfToken = request.headers.get('x-csrf-token');
    
    // Verify CSRF token
    if (!csrfToken || !verifyCSRFToken(request, csrfToken)) {
      return NextResponse.json(
        { message: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

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
