# KoInsight Development Guide

This guide covers everything you need to know to develop KoInsight locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Key Technologies](#key-technologies)
- [Project Structure](#project-structure)
- [Database Management](#database-management)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Contributing](#contributing)

## Prerequisites

### Required Dependencies

Before you begin, ensure you have the following installed:

1. **Node.js** (v22 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use a version manager like [nvm](https://github.com/nvm-sh/nvm)

2. **npm** (v10.2.4 or higher)
   - The project uses npm workspaces for monorepo management

### Recommended Tools

- **nvm** (Node Version Manager) - Makes it easy to switch between Node versions
  ```bash
  # Install nvm (macOS/Linux)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

  # Use the required Node version
  nvm install 22
  nvm use 22
  ```

- **Docker** (optional) - For running the production build locally

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/GeorgeSG/koinsight.git
cd koinsight
```

### 2. Install Dependencies

KoInsight uses a monorepo structure with npm workspaces. Install all dependencies from the root:

```bash
npm install
```

This will install dependencies for:
- Root workspace (build tools, Prettier, Turbo)
- `apps/server` (Express backend)
- `apps/web` (React frontend)
- `packages/common` (shared types)

### 3. Set Up the Database

The development database uses SQLite and is stored in the `data/` directory.

Run database migrations:

```bash
npm run -w server knex migrate:latest
```

### 4. Seed the Database (Optional but Recommended)

Populate your database with realistic fake data for development:

```bash
# From the root directory
npm run seed
```

This creates:
- 5 e-reader devices
- 10 books (popular fantasy/sci-fi titles)
- Realistic reading statistics and page data
- 200+ annotations (highlights, notes, bookmarks)
- 14 genres with book associations
- 3 test users with KoSync progress data

**Test User Credentials:**
- Username: `reader1`, `reader2`, `bookworm`
- Password: `password123` (all users)

See [Database Seeding](#database-seeding) for more details.

## Development Workflow

### Running the Development Server

KoInsight consists of two apps that run concurrently:

#### Option 1: Run Both Apps Together (Recommended)

From the **root directory**:

```bash
npm run dev
```

This uses Turbo to run both apps in parallel:
- **Backend server**: http://localhost:3000 (Express API)
- **Frontend web app**: http://localhost:5173 (Vite dev server)

#### Option 2: Run Apps Individually

**Backend only:**
```bash
cd apps/server
npm run dev
```
- Runs on http://localhost:3001
- Watches for TypeScript changes and auto-restarts

**Frontend only:**
```bash
cd apps/web
npm run dev
```
- Runs on http://localhost:3000
- Hot module replacement enabled


### Development Tips

1. **Frontend proxy**: The Vite dev server (port 3000) proxies API requests to the backend (port 3001)
2. **Hot reload**: Both apps support hot reloading during development
3. **TypeScript**: Changes to TypeScript files trigger automatic recompilation
4. **Shared types**: The `@koinsight/common` package contains types shared between frontend and backend


## Key Technologies

**Backend:**
- Express 5.x - Web framework
- Knex.js - SQL query builder
- better-sqlite3 - SQLite driver
- bcryptjs - Password hashing
- Multer - File upload handling
- Zod - Schema validation

**Frontend:**
- React 18.x - UI library
- Vite - Build tool and dev server
- Mantine UI - Component library
- React Router 7.x - Client-side routing
- SWR - Data fetching and caching
- Recharts - Data visualization

**Development:**
- TypeScript - Type safety
- Turbo - Monorepo build system
- Prettier - Code formatting
- Vitest - Unit testing


## Project Structure

```
koinsight/
├── apps/
│   ├── server/              # Express backend (TypeScript)
│   │   ├── src/
│   │   │   ├── annotations/ # Annotation management
│   │   │   ├── books/       # Book management
│   │   │   ├── db/          # Database migrations, seeds, factories
│   │   │   ├── devices/     # Device management
│   │   │   ├── genres/      # Genre management
│   │   │   ├── kosync/      # KoSync protocol implementation
│   │   │   ├── stats/       # Statistics and analytics
│   │   │   └── app.ts       # Express app entry point
│   │   └── package.json
│   └── web/                 # React frontend (Vite + TypeScript)
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── api/         # API client functions
│       │   └── main.tsx     # App entry point
│       └── package.json
├── packages/
│   └── common/              # Shared types and utilities
│       └── types/           # TypeScript type definitions
├── data/                    # SQLite database files (gitignored)
├── package.json             # Root workspace config
├── turbo.json               # Turbo build configuration
└── .prettierrc              # Prettier configuration
```

## Database Management

### Database Overview

- **Engine**: SQLite (via better-sqlite3)
- **Query Builder**: Knex.js
- **Location**: `data/dev.db` (development), `data/prod.db` (production)
- **Migrations**: Located in `apps/server/src/db/migrations/`
- **Seeds**: Located in `apps/server/src/db/seeds/`

### Running Migrations

```bash
# Run all pending migrations
npm run -w server knex migrate:latest

# Rollback last migration
npm run -w serverknex migrate:rollback

# Create a new migration
npm run -w server knex migrate:make migration_name
```

### Database Seeding

Seed the database with realistic fake data:

```bash
# From root directory
npm run seed
```

**What gets seeded:**

| Data Type | Count | Description |
|-----------|-------|-------------|
| Devices | 5 | Kindle, Kobo, Nook, iPad, Android Tablet |
| Books | 10 | Popular fantasy/sci-fi titles |
| Book-Device Associations | 50 | Each book on each device |
| Page Statistics | ~1,800 | Reading progress over last 100 days |
| Annotations | ~200 | Highlights, notes, and bookmarks |
| Genres | 14 | Fantasy, Sci-Fi, etc. with book associations |
| Users | 3 | Test accounts (password: `password123`) |
| Progress Records | ~13 | KoSync reading progress |


### Advanced Knex Commands

```bash
# Run a specific seed file
npm run -w server knex seed:run -- --specific=01_devices.ts

# Create a new seed file
npm run -w server knex seed:make new_seed_name

# View migration status
npm run -w server knex migrate:status
```

### Resetting the Database

If you need a fresh start:

```bash
# Delete the database
rm data/dev.db

# Run migrations
npm run -w server knex migrate:latest

# Seed with fake data
npm run seed
```

## Code Quality

### Code Formatting

KoInsight uses [Prettier](https://prettier.io/) for consistent code formatting.

**Prettier Configuration** (`.prettierrc`):

**Format your code:**

```bash
# Format all files (from root)
npx prettier --write .

# Format specific files
npx prettier --write "apps/server/**/*.ts"
npx prettier --write "apps/web/**/*.{ts,tsx}"

# Check formatting without changing files
npx prettier --check .
```

**Editor Integration:**
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- Enable "Format on Save" for automatic formatting


## Testing

### Running Tests

```bash
# Run all tests
npm run test:coverage

# Run server tests only
cd apps/server
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

## Contributing

When contributing code:

1. **Format your code** with Prettier before committing
2. **Run tests** to ensure nothing breaks
3. **Write tests** for new features
4. **Update documentation** if needed
5. **Follow existing patterns** in the codebase
