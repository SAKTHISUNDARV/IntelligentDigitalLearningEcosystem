# Intelligent Digital Learning Ecosystem

An end-to-end learning platform with a React frontend and an Express backend for course delivery, assessments, progress tracking, recommendations, search, and AI-assisted learning flows.

## Tech Stack

- Frontend: React 19, Vite, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL, JWT authentication
- Integrations: Supabase, AI/chat services

## Repository Structure

```text
client/   React + Vite application
server/   Express API, database bootstrap, routes, scripts
```

## Core Features

- Authentication with access token and refresh token handling
- Student dashboard, profile, and course discovery
- Course detail pages and guided learning views
- Assessments, quiz history, and results tracking
- Task management and learning progress APIs
- Admin pages for users, categories, courses, and quizzes
- Search, analytics, recommendations, uploads, and AI tutor/chat endpoints

## Getting Started

### Prerequisites

- Node.js 22.x for the backend
- npm
- A PostgreSQL database

### 1. Install dependencies

```bash
cd client
npm install
cd ../server
npm install
```

### 2. Configure environment variables

Frontend example in `client/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

Backend example in `server/.env`:

```env
PORT=5000
HOST=0.0.0.0
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://username:password@localhost:5432/idle_db
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Note: the running backend code currently expects `DATABASE_URL` for PostgreSQL.

### 3. Start the apps

Frontend:

```bash
cd client
npm run dev
```

Backend:

```bash
cd server
npm run dev
```

## Available Scripts

Frontend:

- `npm run dev` starts the Vite dev server
- `npm run build` creates a production build
- `npm run preview` previews the production build
- `npm run lint` runs ESLint

Backend:

- `npm run dev` starts the API with Nodemon
- `npm start` starts the API with Node

## API Surface

The backend mounts routes under `/api`, including:

- `/api/auth`
- `/api/courses`
- `/api/lessons`
- `/api/quizzes`
- `/api/users`
- `/api/modules`
- `/api/materials`
- `/api/upload`
- `/api/progress`
- `/api/categories`
- `/api/analytics`
- `/api/recommendations`
- `/api/chat`
- `/api/tasks`
- `/api/search`

Health endpoints:

- `/`
- `/health`

## Notes

- The root `package.json` currently contains repository metadata only.
- There is no project-wide automated test script configured at the root yet.
