# Development Setup Guide

This guide will help you set up the BlackRoad OS Operator Engine for local development.

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- Redis (optional, for job queuing)
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/BlackRoad-OS/blackroad-os-operator.git
cd blackroad-os-operator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure it for your local setup:

```bash
cp .env.example .env
```

Edit `.env` and update the following required variables:

```bash
# Required
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/blackroad_agents
CORE_API_URL=http://localhost:4000
PUBLIC_AGENTS_URL=http://localhost:3000

# Optional
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

### 4. Database Setup

Create a PostgreSQL database for the agents runtime:

```bash
# Using psql
createdb blackroad_agents

# Or using SQL
psql -c "CREATE DATABASE blackroad_agents;"
```

If you need to set up a user:

```sql
CREATE USER blackroad WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE blackroad_agents TO blackroad;
```

### 5. Redis Setup (Optional)

If you want to use Redis for job queuing:

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

If you skip Redis setup, comment out or remove the `REDIS_URL` variable in your `.env` file.

## Building the Project

Build the TypeScript code:

```bash
npm run build
```

This compiles the TypeScript files from `src/` to JavaScript in `dist/`.

## Running the Services

### Running the API Server

Start the API server (HTTP endpoints):

```bash
# Development mode (with ts-node)
npm run dev:api

# Production mode (compiled)
npm run start:api
```

The API server will start on the port specified in your `.env` file (default: 3000).

**Available endpoints:**
- `GET /health` - Health check endpoint
- `GET /version` - Version information

### Running the Worker

Start the background worker:

```bash
# Development mode (with ts-node)
npm run dev:worker

# Production mode (compiled)
npm run start:worker
```

The worker connects to the database and Redis (if configured) and waits for job subscriptions.

### Running Both Services Concurrently

You can run both services in separate terminal windows:

**Terminal 1:**
```bash
npm run dev:api
```

**Terminal 2:**
```bash
npm run dev:worker
```

## Project Structure

```
blackroad-os-operator/
├── src/
│   ├── api/                 # API server
│   │   ├── routes/         # API route handlers
│   │   └── index.ts        # API entry point
│   ├── worker/             # Background worker
│   │   └── index.ts        # Worker entry point
│   ├── lib/                # Shared libraries
│   │   ├── db.ts          # Database connection
│   │   ├── queue.ts       # Redis queue connection
│   │   └── logger.ts      # Structured logging
│   └── config.ts           # Configuration loader
├── dist/                   # Compiled JavaScript (generated)
├── .env                    # Local environment config (not committed)
├── .env.example           # Example environment config
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Development Workflow

1. Make changes to the TypeScript files in `src/`
2. If using development mode (`npm run dev:api` or `npm run dev:worker`), changes are loaded via ts-node
3. For production testing, rebuild with `npm run build` and run with `npm run start:api` or `npm run start:worker`

## Troubleshooting

### Database Connection Issues

If you see errors about database connectivity:

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check your `DATABASE_URL` in `.env` matches your PostgreSQL configuration

3. Test the connection manually:
   ```bash
   psql "postgresql://user:password@localhost:5432/blackroad_agents"
   ```

### Redis Connection Issues

If you see Redis errors but don't need Redis:

1. Comment out or remove `REDIS_URL` from your `.env` file
2. The system will automatically disable Redis-dependent features

If you need Redis:

1. Verify Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check your `REDIS_URL` in `.env` is correct

### Port Already in Use

If port 3000 is already in use, change the `PORT` variable in your `.env` file:

```bash
PORT=3001
```

## Next Steps

- Review the [README.md](./README.md) for architecture and deployment information
- Check the Railway deployment configuration in `railway.json`
- Explore the API routes in `src/api/routes/`
- Review the worker bootstrap process in `src/worker/index.ts`

## Getting Help

For issues or questions:
- Check the GitHub Issues: https://github.com/BlackRoad-OS/blackroad-os-operator/issues
- Review the deployment workflow: `.github/workflows/deploy-agents.yml`
