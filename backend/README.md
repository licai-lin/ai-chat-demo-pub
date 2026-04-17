# Backend Service

Runnable Node.js API service for chat and admin stats.

## Scripts

- `npm run dev`: start in watch mode with `tsx`
- `npm run typecheck`: TypeScript type checks
- `npm run build`: compile to `dist/`
- `npm run start`: run compiled build

## API Endpoints

- `GET /health`
- `POST /api/chat`
- `GET /api/admin/stats`

## Environment Variables

### Required

- `OPENAI_API_KEY`
- Database connection for backend runtime: `POSTGRES_URL` or `DATABASE_URL` (at least one required)

### Recommended

- `DATABASE_URL`
  - Prisma CLI config (`prisma.config.ts`) reads `DATABASE_URL`
  - Keep this set if you run Prisma commands/migrations

### Optional

- `ENABLE_ADMIN=true` to enable `GET /api/admin/stats` (default: disabled)
- `PORT=4000` to override default backend port
- `NODE_ENV` (usually set automatically by runtime/platform)
