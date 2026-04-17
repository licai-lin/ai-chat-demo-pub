# Frontend App

Next.js frontend for the AI chat demo.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## API Flow

- UI calls Next.js route handlers in `app/api/*`.
- Route handlers proxy to backend service (`BACKEND_API_URL`).
- Default backend URL is `http://localhost:4000`.

## Local Setup

1. Create `frontend/.env.local` from `.env.local.example`.
2. Start backend service first.
3. Run `npm run dev` in this folder.
