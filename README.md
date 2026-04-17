# AI Chat Demo Monorepo

This repo is structured for team-style collaboration with clear frontend/backend boundaries.

## Project Structure

- `frontend/`: Next.js web app (UI + BFF proxy routes)
- `backend/`: Node.js API service (runnable, deployable)
- `contracts/`: shared TypeScript API contracts used by both apps

## Collaboration Model

- Frontend engineers own UI, UX, and client-side state in `frontend/`.
- Backend engineers own API behavior and business logic in `backend/`.
- API request/response shapes are shared via `contracts/`.

This allows parallel development with stable interfaces.

## Local Development

### 1) Start backend API

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:4000` by default.

### 2) Start frontend app

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` and proxies API calls to backend.

## Environment Variables

Backend (`backend/.env`):

- `OPENAI_API_KEY`: required
- `DATABASE_URL` or `POSTGRES_URL`: required
- `ENABLE_ADMIN=true`: optional to enable admin stats route
- `PORT`: optional, default `4000`

Frontend (`frontend/.env.local`):

- `BACKEND_API_URL`: optional, default `http://localhost:4000`

## API Boundaries

- Frontend calls `frontend/app/api/*` routes only.
- Next.js route handlers proxy requests to backend service.
- Backend handles rate limit, token budget, OpenAI calls, and persistence.
