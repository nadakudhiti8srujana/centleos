# CentleOS Frontend

Modern React CRM dashboard connected to the CentleOS FastAPI backend.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router v7
- Axios (JWT auth with auto-refresh)
- Recharts (dashboard analytics)
- @dnd-kit (Kanban pipeline drag-and-drop)

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App runs at http://localhost:5173 — API requests proxy to http://localhost:8000.

## Features

- **Auth**: Login, register (workspace slug), JWT refresh, change password
- **Dashboard**: KPI cards, pipeline bar chart, lead source pie chart, recent leads
- **Leads**: List, search, filter, CRUD, detail with history & activities
- **Pipeline**: Kanban board with drag-and-drop stage updates
- **Contacts / Accounts / Deals**: Full CRUD with search and pagination
- **Settings**: Profile view, password change, logout

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | Backend API base (use proxy in dev) |

## Production Build

```bash
npm run build
npm run preview
```

Deploy to Vercel with `VITE_API_URL=https://your-api.onrender.com/api/v1`.
