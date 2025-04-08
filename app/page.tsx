"use client"

import { useState } from "react"
import {
  Database,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Loader2,
  FileDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { executeQuery } from "./api/query-service"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import DynamicChart from "@/components/ui/dynamic-chart"
import TableStakesLogo from "@/components/ui/table-stakes-logo"

export default function TableStakesApp() {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [resultType, setResultType] = useState<"table" | "graph">("table")
  const [sqlQuery, setSqlQuery] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState("")
  const [sortColumn, setSortColumn] = useState("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [tableData, setTableData] = useState<any[]>([])
  const [tableColumns, setTableColumns] = useState<string[]>([])
  const [chartData, setChartData] = useState<{
    chartType: string
    title: string
    subtitle?: string
    xAxis: string
    yAxis: string
    xAxisKey?: string
    series?: any[]
    processedData?: any[]
    rawData?: any[]
    insights?: string
    recommendedFilters?: string[]
  }>({
    chartType: "bar",
    title: "",
    xAxis: "",
    yAxis: "",
    series: [],
    processedData: []
  })

  const sampleQueries = [
    "find all new enrollments in last week",
    "show how enrollments changed week by week over last quarter",
    "list customers in California with orders over $1000",
    "what was the total revenue last month?",
    "create a chart of enrollments by course",
    "compare sales by store location"
  ]

  const handleSampleQueryClick = (sampleQuery: string) => {
    setQuery(sampleQuery)
  }

  const handleRunQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Query is empty",
        description: "Please enter a query or select one of the sample queries.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)
    setSqlQuery(null)

    try {
      const response = await executeQuery({ query })

      setShowResults(true)
      setResultType(response.resultType)

      // Store the SQL query for display
      if (response.sql) {
        setSqlQuery(response.sql)
      }

      // Process the data based on result type
      if (response.resultType === "graph") {
        setChartData(response.data)
        console.log("Chart data:", response.data)
      } else {
        setTableColumns(response.data.columns || [])
        setTableData(response.data.rows || [])

        // Set initial sort column if we have data
        if (response.data.columns && response.data.columns.length > 0) {
          setSortColumn(response.data.columns[0])
        }
      }
      
      // Log debug info if available
      if (response.debug) {
        console.log("Debug info:", response.debug)
      }
    } catch (error) {
      console.error("Error executing query:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      toast({
        title: "Query execution failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }
  
  const handleDownloadData = () => {
    let dataToDownload = [];
    let filename = "query-results.json";
    
    if (resultType === "table") {
      dataToDownload = tableData;
    } else if (resultType === "graph" && chartData.rawData) {
      dataToDownload = chartData.rawData;
      filename = "chart-data.json";
    }
    
    // Create a blob with the data
    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
    
    // Create an anchor element and trigger a download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `Downloading data as ${filename}`,
    });
  };

  // Filter and sort table data
  const filteredData = tableData.filter((row) =>
    Object.values(row).some(
      (value) =>
        value !== null && value !== undefined && value.toString().toLowerCase().includes(filterText.toLowerCase()),
    ),
  )

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (aValue === bValue) return 0
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    const comparison = aValue.toString().localeCompare(bValue.toString())
    return sortDirection === "asc" ? comparison : -comparison
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TableStakesLogo size="md" />
            <h1 className="text-xl font-semibold text-gray-800">Table Stakes</h1>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="text-sm">
              John Doe
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 bg-white">
        {/* Query Input Section */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-2">Ask your data question in plain English:</h2>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your query here..."
              className="min-h-[100px] text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRunQuery} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Run Query"
                )}
              </Button>
            </div>
            {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
          </div>
        </section>

        <Separator className="my-6" />

        {/* Sample Queries Section */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-3">Need ideas? Try clicking one:</h2>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sampleQuery, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100"
                onClick={() => handleSampleQueryClick(sampleQuery)}
              >
                {sampleQuery}
              </Badge>
            ))}
          </div>
        </section>

        {/* Results Section (Dynamic) */}
        {showResults && (
          <>
            <Separator className="my-6" />

            <section>
              <h2 className="text-lg font-medium text-gray-700 mb-4">Results for: "{query}"</h2>

              {sqlQuery && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-sm font-medium text-gray-500 mb-1">Generated SQL:</div>
                  <pre className="text-xs overflow-x-auto">{sqlQuery}</pre>
                </div>
              )}

              {/* Controls Toolbar (Only for table view) */}
              {resultType === "table" && (
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadData}>
                      <FileDown className="h-4 w-4 mr-1" />
                      Download Data
                    </Button>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Filter results:</span>
                    <Input className="w-64 h-8" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Result Content */}
              {resultType === "table" ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {tableColumns.map((column) => (
                            <TableHead key={column} className="cursor-pointer" onClick={() => handleSort(column)}>
                              {column}
                              {sortColumn === column && (
                                <ArrowUpDown
                                  className={`ml-1 h-4 w-4 inline ${sortDirection === "asc" ? "rotate-180" : ""}`}
                                />
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedData.length > 0 ? (
                          sortedData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {tableColumns.map((column) => (
                                <TableCell key={`${rowIndex}-${column}`}>
                                  {row[column] !== null && row[column] !== undefined ? String(row[column]) : ""}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={tableColumns.length} className="text-center py-4">
                              No results found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {sortedData.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="text-sm text-gray-500">
                          Showing 1-{sortedData.length} of {sortedData.length} results
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="icon" disabled>
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" disabled>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="default" size="sm" className="px-3">
                            1
                          </Button>
                          <Button variant="outline" size="sm" className="px-3">
                            2
                          </Button>
                          <Button variant="outline" size="sm" className="px-3">
                            3
                          </Button>
                          <Button variant="outline" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <DynamicChart
                  chartType={chartData.chartType}
                  title={chartData.title}
                  subtitle={chartData.subtitle}
                  xAxis={chartData.xAxis}
                  yAxis={chartData.yAxis}
                  xAxisKey={chartData.xAxisKey}
                  series={chartData.series}
                  data={chartData.processedData}
                  insights={chartData.insights}
                  onDownload={handleDownloadData}
                />
              )}
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">Version: 1.0.0</div>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Help
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Logout
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
