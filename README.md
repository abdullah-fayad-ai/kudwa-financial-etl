# Kudwa Financial ETL

A Node.js application for extracting, transforming, and loading financial data from various sources into a standardized database format.

## Features

- API-based ETL processes for financial data
- RESTful API for data access and ETL job management
- Company and data source configuration management
- Standardized financial data storage
- Job tracking and monitoring

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript
- **Logging**: Winston

## Prerequisites

- Node.js (v16+)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:

   ```
   git clone [repository-url]
   cd kudwa-financial-etl
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/kudwa_financial"
   PORT=5005
   NODE_ENV=development
   ```

4. Generate Prisma client:

   ```
   npm run prisma:generate
   ```

5. Run database migrations:
   ```
   npm run prisma:migrate
   ```

## Usage

### Development

```
npm run dev
```

### Production

```
npm run build
npm start
```

### Database Management

- Generate Prisma client: `npm run prisma:generate`
- Run migrations: `npm run prisma:migrate`
- Reset database: `npm run db:reset`

## API Endpoints

### ETL Operations

- `POST /api/etl/sync/:companyId` - Start ETL sync process for a company
- `GET /api/etl/job/:id` - Get ETL job status
- `GET /api/etl/jobs/company/:companyId` - Get all ETL jobs for a company
- `GET /api/etl/financial-data/:companyId` - Get financial data for a company

### Data Access

- `GET /api/data/...` - Data access endpoints
- `GET /api/companies/...` - Company management endpoints

### System

- `GET /health` - Health check endpoint

## Project Structure

```
├── src/
│   ├── config/       # Application configuration
│   ├── interfaces/   # TypeScript interfaces
│   ├── middleware/   # Express middleware
│   ├── repositories/ # Data access layer
│   ├── routes/       # API routes
│   ├── schemas/      # Validation schemas
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
├── prisma/
│   └── schema.prisma # Database schema
└── dist/             # Compiled JavaScript
```

## License

ISC
