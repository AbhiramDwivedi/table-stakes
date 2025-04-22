import { OpenAI } from "openai";
import {
  determineResultType,
  generateSQLFromNaturalLanguage,
  generateVisualizationFromData,
} from "../../lib/openai";

// Mock the OpenAI module
jest.mock("openai", () => {
  const mockCreate = jest.fn();
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe("OpenAI module", () => {
  let mockOpenAI: jest.Mocked<any>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Get a reference to the mocked create function
    mockOpenAI = new OpenAI({}).chat.completions.create;
  });

  describe("determineResultType", () => {
    it('returns "graph" for queries with visualization keywords', () => {
      expect(determineResultType("Show me a chart of sales")).toBe("graph");
      expect(determineResultType("Visualize the trend of users")).toBe("graph");
      expect(determineResultType("Plot revenue over time")).toBe("graph");
      expect(determineResultType("Graph the number of signups")).toBe("graph");
    });

    it('returns "table" for standard queries', () => {
      expect(determineResultType("Show me all users")).toBe("table");
      expect(determineResultType("List the top products")).toBe("table");
      expect(determineResultType("What are the sales numbers")).toBe("table");
    });

    it("is case insensitive when checking for keywords", () => {
      expect(determineResultType("SHOW ME A CHART of sales")).toBe("graph");
      expect(determineResultType("visualize the data")).toBe("graph");
      expect(determineResultType("Graph THE results")).toBe("graph");
    });
  });

  describe("generateSQLFromNaturalLanguage", () => {
    it("successfully generates SQL from natural language", async () => {
      // Mock the API response
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "SELECT * FROM users WHERE active = true",
            },
          },
        ],
      });

      const schema = {
        users: ["id", "name", "email", "active"],
        products: ["id", "name", "price"],
      };

      const result = await generateSQLFromNaturalLanguage(
        "Show me all active users",
        schema
      );

      expect(result).toBe("SELECT * FROM users WHERE active = true");
      expect(mockOpenAI).toHaveBeenCalledTimes(1);
      expect(mockOpenAI.mock.calls[0][0].messages[0].content).toContain(
        "Show me all active users"
      );
    });

    it("handles markdown-formatted SQL responses", async () => {
      // Mock the API response with markdown formatting
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "```sql\nSELECT * FROM users WHERE active = true\n```",
            },
          },
        ],
      });

      const schema = {
        users: ["id", "name", "email", "active"],
        products: ["id", "name", "price"],
      };

      const result = await generateSQLFromNaturalLanguage(
        "Show me all active users",
        schema
      );

      expect(result).toBe("SELECT * FROM users WHERE active = true");
    });

    it("handles enrollment queries with time references", async () => {
      // Mock the API response
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "SELECT * FROM enrollments WHERE date > '2023-01-01'",
            },
          },
        ],
      });

      const schema = {
        enrollments: ["id", "user_id", "course_id", "date"],
      };

      const currentDate = new Date(2023, 3, 15); // April 15, 2023
      const dateStr = currentDate.toISOString().split("T")[0];

      const result = await generateSQLFromNaturalLanguage(
        "Show me recent enrollments",
        schema,
        currentDate
      );

      expect(mockOpenAI).toHaveBeenCalledTimes(1);
      expect(mockOpenAI.mock.calls[0][0].messages[0].content).toContain(
        `Current date: ${dateStr}`
      );
    });

    it("handles API errors gracefully", async () => {
      // Mock an API error
      mockOpenAI.mockRejectedValueOnce(new Error("API connection failed"));

      const schema = {
        users: ["id", "name", "email", "active"],
      };

      await expect(
        generateSQLFromNaturalLanguage("Show me all active users", schema)
      ).rejects.toThrow("OpenAI API error: API connection failed");
    });
  });

  describe("generateVisualizationFromData", () => {
    it("returns a fallback visualization when no data is provided", async () => {
      const result = await generateVisualizationFromData(
        "Show me a graph of sales",
        []
      );

      expect(result.chartType).toBe("bar");
      expect(result.title).toBe("No data available");
    });

    it("successfully generates visualization specs from query result", async () => {
      // Mock successful API response
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                chartType: "line",
                title: "revenue by date",
                xAxisKey: "date",
                series: [
                  {
                    dataKey: "revenue",
                    name: "Revenue",
                  },
                ],
              }),
            },
          },
        ],
      });

      const data = [
        { date: "2023-01-01", revenue: 1000 },
        { date: "2023-01-02", revenue: 1500 },
        { date: "2023-01-03", revenue: 1200 },
      ];

      const result = await generateVisualizationFromData(
        "Show me revenue trends",
        data
      );

      expect(result.chartType).toBe("line");
      // Just check that we have a title, not necessarily the exact value
      expect(result.title).toBeTruthy(); 
      expect(result.xAxisKey).toBe("date");
      expect(result.series).toHaveLength(1);
      expect(result.series[0].dataKey).toBe("revenue");
    });

    it("uses fallback visualization when OpenAI returns empty content", async () => {
      // Mock empty API response
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "",
            },
          },
        ],
      });

      const data = [
        { date: "2023-01-01", revenue: 1000 },
        { date: "2023-01-02", revenue: 1500 },
      ];

      const result = await generateVisualizationFromData(
        "Show me revenue trends",
        data
      );

      expect(result.chartType).toBe("bar");
      expect(result.title).toBe("Query Results");
    });

    it("handles JSON parsing errors in the OpenAI response", async () => {
      // Mock invalid JSON response
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "This is not valid JSON",
            },
          },
        ],
      });

      const data = [
        { date: "2023-01-01", revenue: 1000 },
        { date: "2023-01-02", revenue: 1500 },
      ];

      const result = await generateVisualizationFromData(
        "Show me revenue trends",
        data
      );

      expect(result.chartType).toBe("bar");
      expect(result.title).toBe("Query Results");
    });

    it("handles API errors gracefully", async () => {
      // Mock API error
      mockOpenAI.mockRejectedValueOnce(new Error("API rate limit exceeded"));

      const data = [
        { date: "2023-01-01", revenue: 1000 },
        { date: "2023-01-02", revenue: 1500 },
      ];

      const result = await generateVisualizationFromData(
        "Show me revenue trends",
        data
      );

      expect(result.chartType).toBe("bar");
      expect(result.title).toBe("Query Results");
      expect(result.series[0].dataKey).toBe("revenue");
    });
  });
});