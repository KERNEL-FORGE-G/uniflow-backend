# UniFlow Backend

Backend API for the UniFlow application.

## Prerequisites

- Node.js (v20+)
- npm
- PostgreSQL

## Project Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in the `.env` file with the required credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - Supabase credentials.
   - Cloudinary credentials.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

## API Documentation

The project includes an interactive Swagger documentation. Once the server is running, you can access it at:

`[YOUR_DOMAIN]/api/docs`

For local development, it is typically:
`http://localhost:3000/api/docs`

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
