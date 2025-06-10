#!/bin/bash

echo "Setting up Kudwa Financial ETL"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/kudwa_financial_etl\"" > .env
  echo "PORT=5005" >> .env
  echo "NODE_ENV=development" >> .env
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Check if database exists and is accessible
echo "Checking database connection..."
npx prisma db push --skip-generate || {
  echo "Error: Could not connect to database."
  echo "Please ensure PostgreSQL is running and the DATABASE_URL in .env is correct."
  exit 1
}

# Run database migrations and seed
echo "Setting up database..."
npx prisma migrate dev --name init --create-only || true
npx prisma migrate deploy
npx prisma db seed

echo "Setup complete! You can now run the server with:"
echo "npm run dev" 