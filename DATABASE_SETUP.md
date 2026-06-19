# Database Setup Guide

## Issue
The application is failing with the error: `Environment variable not found: DATABASE_URL`

## Solution
You need to set up a PostgreSQL database and configure the environment variables.

## Step 1: Install PostgreSQL

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database
1. Open PostgreSQL command line or pgAdmin
2. Create a database for the application:
```sql
CREATE DATABASE safemeds;
```

## Step 3: Set Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/safemeds"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Replace `your_password` with the actual password you set for the postgres user.

## Step 4: Run Database Migrations

After setting up the environment variables, run the following commands:

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to the database
npm run db:push

# Or run migrations
npm run db:migrate
```

## Step 5: Verify Setup

1. Start the development server:
```bash
npm run dev
```

2. Try to access the signup page and create a test account

## Alternative: Use a Cloud Database

If you prefer to use a cloud database service:

### Supabase (Recommended)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Use it as your `DATABASE_URL`

### Railway
1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Copy the connection string
4. Use it as your `DATABASE_URL`

### Neon
1. Go to https://neon.tech
2. Create a new database
3. Copy the connection string
4. Use it as your `DATABASE_URL`

## Troubleshooting

### Common Issues

1. **Connection refused**: Make sure PostgreSQL is running
2. **Authentication failed**: Check your username and password
3. **Database does not exist**: Create the database first
4. **Permission denied**: Make sure the user has access to the database

### Test Connection
You can test your database connection using:
```bash
npx prisma db pull
```

This command will try to connect to your database and pull the current schema.
