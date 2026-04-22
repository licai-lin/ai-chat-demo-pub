# Frontend + Backend Run Guide

This guide is only for running this application locally and confirming frontend-backend connectivity.

## 1. Start Backend

Open Terminal A:

```bash
cd /Users/user/projects/aichatdemo/backend
npm install
npm run dev
```

Expected log:

```text
Backend API listening on http://localhost:4000
```

## 2. Confirm Backend Is Up

Open Terminal C (or a new tab):

```bash
curl http://localhost:4000/health
```

Expected response (example):

```json
{"ok":true,"timestamp":"..."}
```

## 3. Start Frontend

Open Terminal B:

```bash
cd /Users/user/projects/aichatdemo/frontend
npm install
npm run dev
```

Expected log includes:

```text
Local: http://localhost:3000
```

## 4. Open the App

In browser:

```text
http://localhost:3000
```

## 5. Verify Frontend Proxy -> Backend

Run:

```bash
curl -i http://localhost:3000/api/admin/stats
```

Expected:
- HTTP `200`
- JSON stats payload

## 6. Verify Chat Works End-to-End

In the UI:
1. Type a message in the chat input.
2. Click `Send`.
3. Confirm assistant response appears.

## Troubleshooting

### Backend port already in use (`EADDRINUSE`)

Run backend on another port:

```bash
cd /Users/user/projects/aichatdemo/backend
PORT=4001 npm run dev
```

Then set frontend backend URL:

```bash
cd /Users/user/projects/aichatdemo/frontend
echo 'BACKEND_API_URL=http://localhost:4001' >> .env
npm run dev
```

### `/api/chat` returns 500

Usually means backend is down or backend env is not loaded.

Check:
1. Backend terminal is still running.
2. `curl http://localhost:4000/health` returns `200`.
3. Backend `.env` exists and contains required values (`OPENAI_API_KEY`, `DATABASE_URL` or `POSTGRES_URL`).
