# CentleOS — Multi-Tenant CRM + ERP + Referral Platform

Production-ready SaaS foundation for the Centle India Hackathon.

## Project Structure

```
centleos/
├── backend/                    # FastAPI backend (Render)
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── api/v1/             # API route handlers
│   │   ├── core/               # Config, security, DB, dependencies
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI application entry
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # React + Vite (Vercel)
│   ├── src/
│   │   ├── components/         # UI, layout, feature components
│   │   ├── contexts/           # Auth context
│   │   ├── pages/              # Dashboard, CRM pages
│   │   ├── services/           # API client layer
│   │   └── types/              # TypeScript types
│   └── package.json
├── database/
│   └── schema.sql              # PostgreSQL schema (Neon)
└── README.md
```

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, Vite, Tailwind, Recharts     |
| Backend  | FastAPI, SQLAlchemy, JWT            |
| Database | PostgreSQL (Neon)                   |
| Deploy   | Vercel (FE), Render (BE)              |

## Multi-Tenant Architecture

Every tenant-scoped table includes `company_id`. Data isolation is enforced at the API layer via `get_workspace_context()` dependency.

**Workspaces (seeded in Phase 2):**

| Slug        | Company     |
|-------------|-------------|
| skill-tank  | Skill Tank  |
| maceco      | Maceco      |
| tobofu      | Tobofu      |
| promtal     | Promtal     |
| vriddhi     | Vriddhi     |

## User Roles

| Role                  | Scope                              |
|-----------------------|------------------------------------|
| `super_admin`         | All workspaces, full platform      |
| `company_admin`       | Single workspace, admin access     |
| `sales_representative`| CRM, deals, contacts               |
| `ambassador`          | Referral links, commissions        |

## Database Schema

13 core tables with full relationships:

- `companies`, `users`, `refresh_tokens`
- `leads`, `lead_history`, `contacts`, `activities`, `deals`
- `customers`, `invoices`
- `referral_links`, `referral_clicks`, `referrals`
- `notifications`

See [`database/schema.sql`](database/schema.sql) for the complete PostgreSQL DDL.

## Authentication API

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | `/api/v1/auth/register`         | Register workspace user  |
| POST   | `/api/v1/auth/login`            | Login, get JWT tokens    |
| POST   | `/api/v1/auth/refresh`          | Refresh access token     |
| POST   | `/api/v1/auth/logout`           | Revoke refresh tokens    |
| GET    | `/api/v1/auth/me`               | Current user profile     |
| POST   | `/api/v1/auth/change-password`  | Change password          |

### Register Example

```json
POST /api/v1/auth/register
{
  "email": "sales@skilltank.in",
  "password": "securepass123",
  "full_name": "Ravi Kumar",
  "role": "sales_representative",
  "company_slug": "skill-tank"
}
```

## Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Configure DATABASE_URL + SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: http://localhost:5173 (proxies `/api` to backend)

### Database Setup

Option A — Run raw SQL on Neon:
```bash
psql $DATABASE_URL -f ../database/schema.sql
```

Option B — Alembic migrations:
```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

## What's Built

### Phase 1 — Backend Foundation
- [x] Folder structure
- [x] PostgreSQL schema with enums, indexes, triggers
- [x] SQLAlchemy models with relationships
- [x] JWT authentication (register, login, logout, refresh)
- [x] Role-based access control dependencies
- [x] Multi-tenant workspace isolation helpers

### Phase 2 — CRM Backend + Frontend
- [x] CRM API (leads, contacts, accounts, deals, activities)
- [x] React frontend with HubSpot-style dashboard
- [x] Kanban pipeline, lead detail, activity timeline
- [x] Dashboard with Recharts analytics

## Coming Next (Phase 3+)

- ERP module (customers, invoices, PDF)
- Referral system
- Dashboard AI insights
- Notifications (email, Telegram)
- Seed data + deployment configs
