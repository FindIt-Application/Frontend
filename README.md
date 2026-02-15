# Frontend

This is a Next.js frontend for a security scanning and reporting platform. It includes a public marketing site, authentication flows, and a dashboard area for scans, findings, reports, assets, and settings. The UI currently uses mock data from `src/data/data.ts` while backend integration is in progress.

## Status

This project is under active development and not yet production-ready.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- MUI and Radix UI
- Three.js / @react-three/fiber for 3D visuals

## Deployment

The frontend is deployed on Vercel. The backend is not deployed yet and is still being designed.

## App Structure

- `src/app/(public)`: Marketing site (home, pricing)
- `src/app/(auth)`: Login, register, forgot password, OTP verify
- `src/app/(dashboard)`: Authenticated dashboard routes (scans, findings, reports, assets, settings)
- `src/components`: Reusable UI and feature components
- `src/data`: Mock data used by dashboard pages
- `src/lib`, `src/hooks`, `src/types`, `src/styles`: Shared utilities, hooks, types, and styling

## Planned Backend Tech Stack

- Go for orchestration services
- Rust for worker pool execution
- Docker for packaging and runtime isolation

## Planned Monorepo Structure

- `frontend/`: Current Next.js app
- `backend/`: Backend services and workers
- `backend/orchestrator/`: Go orchestration service
- `backend/services/`: Go service layer (API gateways, schedulers, control-plane)
- `backend/workers/`: Rust worker pool(s) (scanner, parser, enrichment, etc.)
- `backend/shared/`: Shared proto contracts, schemas, and common libraries
- `infra/`: Docker files, compose files, and deployment assets

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run start`: Run the production build
- `npm run lint`: Run linting
# Frontend
