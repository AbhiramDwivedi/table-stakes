# Table Stakes

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

Table Stakes is an AI-powered natural language to SQL query tool that allows users to interact with databases using plain English. Ask questions about your data and get instant visualizations and insights without writing a single line of SQL.

![Table Stakes Screenshot](public/screenshot.svg)

## Features

- 💬 **Natural Language Querying**: Ask questions in plain English and get data-driven answers
- 📊 **Intelligent Visualizations**: Automatic generation of appropriate charts and graphs based on query context
- 🧠 **AI-Powered Analysis**: Get key insights about your data without being a data scientist
- 📥 **Data Export**: Download query results and visualizations for use in other tools
- 🎨 **Beautiful UI**: Modern, responsive interface built with shadcn/ui components
- 🔄 **Interactive Filtering**: Sort, filter, and explore your data in real-time
- 🚀 **Fast Performance**: Optimized for quick responses, even with large datasets

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- Any SQL database (PostgreSQL, MySQL, etc.) - the application works with any database schema
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AbhiramDwivedi/table-stakes.git
cd table-stakes
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up your environment variables:
   
   The repository includes an `.env.example` file that you can use as a template. Copy it to create your own `.env.local` file:

```bash
cp .env.example .env.local
```

Then edit the `.env.local` file to add your specific configuration:

```env
# Database connection (replace with your database details)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_TYPE=postgresql

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
```

4. (Optional) Run the database setup script:

```bash
node setup-database.js
```

This step is optional and only necessary if you want to set up a sample database with example data. Table Stakes is designed to work with any existing database schema.

5. Start the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using Docker

Alternatively, you can use Docker to run the application:

```bash
docker-compose up -d
```

## Usage Examples

Here are some example queries you can try:

- "Find all new enrollments in the last week"
- "Show how enrollments changed week by week over last quarter"
- "List customers in California with orders over $1000"
- "What was the total revenue last month?"
- "Create a chart of enrollments by course"
- "Compare sales by store location"

## Technical Architecture

Table Stakes is built using a modern tech stack:

- **Frontend**: Next.js with React and TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Visualization**: Recharts for interactive data visualization
- **AI Processing**: OpenAI's GPT models for natural language understanding
- **Database**: PostgreSQL for data storage
- **API**: Next.js API routes for server-side logic

The application follows this high-level flow:

1. User inputs a natural language query
2. The query is transformed into SQL using OpenAI's language models
3. SQL is executed against the database
4. Results are processed and analyzed by the AI
5. Appropriate visualizations are generated based on data and query intent
6. Results and insights are presented to the user

## Customizing for Your Data

Table Stakes is designed to work with any database schema without modifications. The application dynamically adapts to your database structure when you connect to it.

However, you can optimize the experience by:

1. Ensuring your database connection is properly configured in your `.env.local` file
2. Reviewing and adjusting the database interface in `lib/database/interface.ts` if needed
3. Optionally customizing the prompts in `lib/openai.ts` to better describe your specific data model

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for their powerful language models
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Recharts](https://recharts.org/) for the charting library
- [Next.js](https://nextjs.org/) for the React framework

---

Made with ❤️ by [Abhiram Dwivedi](https://github.com/AbhiramDwivedi)