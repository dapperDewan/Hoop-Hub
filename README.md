# Hoop Hub

Hoop Hub is a full-stack basketball companion that pairs an Express + MongoDB API with a modern React 19/Vite frontend. Fans can scout players, assemble dream teams, manage favorites, browse verified merch, and stay on top of fixtures with a responsive, animation-rich UI.

## Feature Highlights
- **Secure auth flows** with JWT sessions, admin gating, and a shared modal + `/auth` route ready for Google OAuth.
- **Dream Team builder** that syncs with favorites and exposes community rosters.
- **Rich content modules** for fixtures, fun facts, merchandise, and player/team deep dives.
- **Seed scripts** to bootstrap players, teams, merchandise, and match data for rapid demos.
- **Performance-minded frontend** powered by Vite, Tailwind CSS, and Framer Motion with Lighthouse-friendly patterns.

## Project Structure
```
.
├── backend/                 # Express API + MongoDB models
│   ├── config/              # Database connection helpers
│   ├── controller/          # Route handlers
│   ├── middleware/          # Auth middleware
│   ├── model/               # Mongoose schemas
│   ├── routes/              # Route definitions
│   ├── scripts/seed*.js     # Seeding & verification utilities
│   └── server.js            # App entry point
├── frontend/                # React 19 + Vite single-page app
│   ├── src/components       # Feature pages & shared UI
│   ├── src/pages            # Standalone route-level views
│   ├── src/services         # Axios API client
│   └── public/              # Static assets
├── package.json             # Root dependencies (if needed)
├── README.md                # You are here
└── .gitignore               # Repo-wide ignores
```

## Requirements
- Node.js 20.x or later (LTS recommended)
- npm 10.x or later
- MongoDB Atlas cluster or self-hosted MongoDB instance

## Environment Variables
Create `.env` files in the project root(s) as needed. Example values:

| Location        | Variable        | Description                                  |
|-----------------|-----------------|----------------------------------------------|
| `backend/.env`  | `MONGO_URI`     | MongoDB connection string                    |
|                 | `JWT_SECRET`    | Secret used to sign auth tokens              |
|                 | `PORT`          | (Optional) API port, defaults to `5000`      |
| `frontend/.env` | `VITE_API_BASE_URL` | Base URL pointing at the backend (e.g. `http://localhost:5000/api`) |

> Never commit real credentials. The new `.gitignore` already excludes `.env` files.

## Installation
```bash
# From the repo root
cd backend
npm install

cd ../frontend
npm install
```

## Running the Apps
### Backend API
```bash
cd backend
npm run dev
```
This starts the Express server on `PORT` (default `5000`).

### Frontend (Vite)
```bash
cd frontend
npm run dev
```
Vite serves the SPA at `http://localhost:5173` and proxies API calls using `VITE_API_BASE_URL`.

## Seeding the Database
Several helpers live in `backend/scripts/`:
- `seedData.js` – inserts starter teams and players.
- `seedPlayers.js`, `seedPlayers.cjs`, `seed/matches.js`, `seed/merchandise.js` – additional fixtures and merch datasets.

Run them with Node after configuring `MONGO_URI`, for example:
```bash
cd backend
node scripts/seedData.js
```

## Useful npm Scripts
| Location  | Script        | Purpose                                |
|-----------|---------------|----------------------------------------|
| backend   | `npm run dev` | Nodemon-powered API development server |
| frontend  | `npm run dev` | Vite dev server with hot module reload |
| frontend  | `npm run build` | Production build of the SPA           |
| frontend  | `npm run preview` | Preview the production build        |
| frontend  | `npm run lint` | ESLint over the React codebase        |

## Deployment Notes
- Serve the frontend build output (from `frontend/dist`) via a static host, and expose the backend API separately (or behind the same domain via a reverse proxy).
- Remember to set `VITE_API_BASE_URL` to the deployed API before building the frontend.
- Keep production secrets (JWT secret, Mongo URI, OAuth keys) in your hosting platform’s secret manager.



With the repo-level `.gitignore` and this README in place, the project is ready for commits and pushes without leaking local artifacts.
