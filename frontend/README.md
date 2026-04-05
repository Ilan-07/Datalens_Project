# Frontend

DataLens frontend is now a React + Vite + TypeScript application.

## Requirements

- Node.js 20+
- npm 10+

## Environment

Create a local env file from the example.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Linux/macOS:

```bash
cp .env.example .env.local
```

Required variables:

- `VITE_API_URL` backend API base URL, default `http://localhost:8000`

Legacy Next-style variables are still supported for compatibility:

- `NEXT_PUBLIC_API_URL`

## Scripts

- `npm run dev` start dev server on port 3000
- `npm run build` build production bundle
- `npm run start` preview built bundle on port 4173
- `npm run typecheck` run TypeScript checks
- `npm run lint` run ESLint

## Local Development

```bash
npm install
npm run dev
```

The app is served at `http://localhost:3000`.
