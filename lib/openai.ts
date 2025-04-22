// Add OpenAI Node.js shim for testing environments
import 'openai/shims/node';

import OpenAI from "openai"
import type { DatabaseSchema, QueryResult } from "./database/interface"
import type { GraphResult } from "./result-formatter"
import { getApiKey, getEnvVariable } from "./utils/env-validator"

// Initialize OpenAI client with secure API key handling
const isTestEnvironment = process.env.NODE_ENV === 'test';
const apiKey = isTestEnvironment 
  ? 'test-api-key-for-jest-tests' 
  : getApiKey('OPENAI_API_KEY'); // Uses our secure method

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: isTestEnvironment, // Allow in test environment which uses jsdom
});

// Default model to use for OpenAI requests
const DEFAULT_MODEL = getEnvVariable('OPENAI_MODEL', 'gpt-4o-mini')

/**
 * Convert a natural language query to SQL using OpenAI
 */
export async function generateSQLFromNaturalLanguage(query: string, schema: DatabaseSchema): Promise<string> {
  // Format the schema information for the prompt
  const schemaInfo = formatSchemaForPrompt(schema)
  
  // Handle enrollment queries specifically
  if (query.toLowerCase().includes("enrollment") && 
      (query.toLowerCase().includes("week") || 
       query.toLowerCase().includes("month") || 
       query.toLowerCase().includes("quarter"))) {
    console.log("Detected enrollment query with time reference")
    return handleEnrollmentQuery(query)
  }
  
  // Get current date for temporal queries
  const currentDate = new Date()
  const formattedCurrentDate = currentDate.toISOString().split('T')[0]
  
  const prompt = `
    You are a SQL expert. Convert the following natural language query into a SQL query.
    
    Database Schema:
    ${schemaInfo}
    
    Today's date: ${formattedCurrentDate}
    
    User Query: ${query}
    
    Important notes for time references:
    1. For date calculations, always use ISO format (YYYY-MM-DD)
    2. For "last week" use date >= (current_date - interval '7 days')
    3. For "this month" use date >= date_trunc('month', current_date)
    4. For "last month" use date BETWEEN date_trunc('month', current_date - interval '1 month') AND date_trunc('month', current_date) - interval '1 day'
    5. For "last quarter" use date >= date_trunc('quarter', current_date - interval '3 months') AND date < date_trunc('quarter', current_date)
    6. For "last year" use date >= date_trunc('year', current_date - interval '1 year') AND date < date_trunc('year', current_date)
    
    Return only the SQL query without any explanation or markdown formatting.
  `

  try {
    console.log(`Using model: ${DEFAULT_MODEL} for SQL generation`)
    console.log(`SQL Generation Prompt: ${prompt}`)
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are a SQL expert that converts natural language to SQL queries." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1, // Low temperature for more deterministic results
      max_tokens: 500,
    })

    let sql = response.choices[0].message.content?.trim() || ""
    console.log(`LLM Response for SQL: ${sql}`)

    // Remove any markdown code block formatting if present
    sql = sql.replace(/^```sql\s*/i, "").replace(/\s*```$/i, "")

    console.log(`Final SQL: ${sql}`)
    return sql
  } catch (error) {
    console.error("Error generating SQL:", error)
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Handle enrollment queries specifically to ensure correct date handling
 */
function handleEnrollmentQuery(query: string): string {
  console.log("Using specialized enrollment query handler")
  
  // Calculate dates for different time periods
  const today = new Date()
  
  // Last week
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)
  const formattedLastWeek = lastWeek.toISOString().split('T')[0]
  
  // Last month
  const lastMonth = new Date(today)
  lastMonth.setMonth(today.getMonth() - 1)
  const formattedLastMonth = lastMonth.toISOString().split('T')[0]
  
  // Last quarter (3 months ago)
  const lastQuarter = new Date(today)
  lastQuarter.setMonth(today.getMonth() - 3)
  const formattedLastQuarter = lastQuarter.toISOString().split('T')[0]
  
  // Format current date
  const formattedToday = today.toISOString().split('T')[0]
  
  // Determine time period from query
  let startDate = formattedLastWeek
  let timeDescription = "in the last week"
  
  if (query.toLowerCase().includes("month")) {
    startDate = formattedLastMonth
    timeDescription = "in the last month"
  } else if (query.toLowerCase().includes("quarter")) {
    startDate = formattedLastQuarter
    timeDescription = "in the last quarter"
  }
  
  console.log(`Time period detected: ${timeDescription} (${startDate} to ${formattedToday})`)
  
  // Extract relevant parts from the query
  const isActive = query.toLowerCase().includes("active") ? "AND status = 'active'" : ""
  
  // Create appropriate SQL
  const sql = `
    SELECT * FROM enrollments 
    WHERE enrollment_date >= '${startDate}' 
    AND enrollment_date <= '${formattedToday}'
    ${isActive}
    ORDER BY enrollment_date DESC
  `.trim()
  
  console.log(`Enrollment query handler generated SQL: ${sql}`)
  return sql
}

/**
 * Determine if the query should return a table or a graph
 */
export function determineResultType(query: string): "table" | "graph" {
  const graphKeywords = [
    "trend",
    "over time",
    "chart",
    "graph",
    "plot",
    "visualization",
    "compare",
    "comparison",
    "week by week",
    "month by month",
    "distribution",
    "histogram",
    "pie chart",
    "bar chart",
  ]

  const queryLower = query.toLowerCase()
  for (const keyword of graphKeywords) {
    if (queryLower.includes(keyword)) {
      return "graph"
    }
  }

  return "table"
}

/**
 * Format the database schema for the OpenAI prompt
 */
function formatSchemaForPrompt(schema: DatabaseSchema): string {
  return schema.tables
    .map((table) => {
      const columns = table.columns.map((col) => `${col.name} (${col.dataType})`).join(", ")
      return `Table: ${table.name}\nColumns: ${columns}`
    })
    .join("\n\n")
}

/**
 * Process graph data with OpenAI to get better visualization suggestions
 */
export async function enhanceGraphData(query: string, data: any, resultType: "table" | "graph"): Promise<any> {
  if (resultType !== "graph") {
    return data
  }

  try {
    const prompt = `
      You are a data visualization expert. Based on the following query and data, suggest the best way to visualize this data.
      
      Query: ${query}
      
      Data: ${JSON.stringify(data)}
      
      Provide a JSON response with the following structure:
      {
        "chartType": "bar|line|pie|scatter",
        "title": "Suggested chart title",
        "xAxis": "Column to use for x-axis",
        "yAxis": "Column to use for y-axis",
        "labels": ["Label1", "Label2", ...],
        "values": [value1, value2, ...]
      }
    `

    console.log(`Using model: ${DEFAULT_MODEL} for graph data enhancement`)
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are a data visualization expert." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0].message.content
    if (!content) {
      return data
    }

    return JSON.parse(content)
  } catch (error) {
    console.error("Error enhancing graph data:", error)
    return data // Return original data if enhancement fails
  }
}

/**
 * Generate visualization specification from data using LLM
 */
export async function generateVisualizationFromData(
  query: string, 
  queryResult: QueryResult
): Promise<GraphResult> {
  const { columns, rows } = queryResult;
  
  // Early return if no data
  if (rows.length === 0) {
    return {
      chartType: "none",
      title: "No Data Available",
      xAxis: "Category",
      yAxis: "Value",
      labels: [],
      values: [],
      rawData: [],
    };
  }
  
  console.log(`Generating visualization specification using ${DEFAULT_MODEL} for ${rows.length} rows of data`);
  
  // Format the data for the LLM in a more compact way to avoid token limits
  let formattedData;
  let dataDescription;
  
  if (rows.length > 50) {
    // For large datasets, send a sample and summary statistics
    const sample = rows.slice(0, 20);
    dataDescription = `${rows.length} rows of data with columns: ${columns.join(', ')}. 
    Showing first 20 rows as sample.`;
    formattedData = JSON.stringify(sample);
  } else {
    dataDescription = `${rows.length} rows of data with columns: ${columns.join(', ')}`;
    formattedData = JSON.stringify(rows);
  }
  
  // Use the LLM to analyze the data and create visualization specs
  const prompt = `
    You are a data visualization expert. Based on the following query and data, create a visualization specification.
    
    User Query: "${query}"
    
    Data Description: ${dataDescription}
    
    Data: ${formattedData}
    
    Analyze this data and determine the best visualization approach. Return a JSON specification with the following structure:
    {
      "chartType": one of: "bar", "line", "pie", "scatter", "area", "composed",
      "title": "Clear descriptive title for the chart",
      "subtitle": "Optional subtitle with additional context",
      "xAxisLabel": "Label for the X axis",
      "yAxisLabel": "Label for the Y axis",
      "xAxisKey": "The data field to use for X axis",
      "series": [
        {
          "dataKey": "Field name to visualize",
          "name": "Display name for the series",
          "color": "#hexcolor",
          "type": "Optional: bar, line, area, etc. for composed charts"
        },
        ... additional series if needed
      ],
      "data": [
        // Transformed data ready for visualization
        // For example, aggregated by date, grouped by category, etc.
        // This should be complete, correctly formatted data ready for charting
      ],
      "insights": "3-5 key insights about the data",
      "recommendedFilters": ["optional list of fields that would be useful as filters"]
    }
    
    Important:
    1. Create proper aggregations or transformations as needed (group by date, category, etc.)
    2. For time series data, ensure dates are properly parsed and formatted
    3. Choose appropriate colors that are visually distinct and accessible
    4. For complex data, consider using a composed chart with multiple series
    5. Return only the JSON object with no explanation
  `;
  
  console.log("Visualization prompt sent to LLM");
  
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are a data visualization expert that transforms raw data into chart specifications." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    console.log("Received visualization specification from LLM");
    
    if (!content) {
      console.error("No content returned from OpenAI");
      return fallbackVisualization(queryResult);
    }
    
    try {
      const visualizationSpec = JSON.parse(content);
      
      // Ensure we have the required fields
      if (!visualizationSpec.chartType || !visualizationSpec.data) {
        console.error("Invalid visualization spec (missing required fields):", visualizationSpec);
        return fallbackVisualization(queryResult);
      }
      
      // Map the visualization spec to our GraphResult interface
      return {
        chartType: visualizationSpec.chartType,
        title: visualizationSpec.title || "Data Visualization",
        subtitle: visualizationSpec.subtitle,
        xAxis: visualizationSpec.xAxisLabel || "",
        yAxis: visualizationSpec.yAxisLabel || "",
        xAxisKey: visualizationSpec.xAxisKey,
        series: visualizationSpec.series || [],
        processedData: visualizationSpec.data,
        rawData: rows,
        insights: visualizationSpec.insights,
        recommendedFilters: visualizationSpec.recommendedFilters || []
      };
    } catch (error) {
      console.error("Error parsing visualization JSON:", error);
      return fallbackVisualization(queryResult);
    }
  } catch (error) {
    console.error("Error generating visualization spec:", error);
    return fallbackVisualization(queryResult);
  }
}

/**
 * Fallback visualization if the LLM generation fails
 */
function fallbackVisualization(queryResult: QueryResult): GraphResult {
  const { columns, rows } = queryResult;
  
  // Simple auto-detection of appropriate visualization
  let chartType = "bar";
  let xAxisKey = columns[0] || "category";
  let dataField = columns.length > 1 ? columns[1] : columns[0];
  
  // Detect date/time columns for potential line charts
  const potentialDateColumns = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('month') ||
    col.toLowerCase().includes('year')
  );
  
  if (potentialDateColumns.length > 0) {
    chartType = "line";
    xAxisKey = potentialDateColumns[0];
  }
  
  // Prepare a basic series configuration
  const series = [{
    dataKey: dataField,
    name: dataField,
    color: "#8884d8"
  }];
  
  return {
    chartType: chartType,
    title: `${dataField} by ${xAxisKey}`,
    xAxis: xAxisKey,
    yAxis: dataField,
    xAxisKey: xAxisKey,
    series: series,
    processedData: rows,
    rawData: rows,
  };
}
