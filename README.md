# MaintainIQ

Asset & maintenance management app built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **Dashboard** — live stats (total assets, active issues, resolved today, technicians), priority issues, recent activity feed, quick actions.
- **Asset Registry** — add, view, and manage assets, with a public QR-style asset page.
- **Issue Tracker** — report and track maintenance issues.
- **Service History** — full history log of past maintenance activity.
- **Auth** — login, signup, forgot/reset password (Supabase Auth), protected + admin-only routes.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables — copy `.env.example` to `.env` and fill in your Supabase project URL and anon key:
   ```bash
   cp .env.example .env
   ```

3. Set up the database — run `supabase/schema.sql` in your Supabase project's SQL Editor. It includes setup notes for Auth providers, redirect URLs, and Realtime.

4. Run the dev server:
   ```bash
   npm run dev
   ```

## Tech Stack

- React 19 + React Router
- Vite
- Tailwind CSS
- Supabase (Auth, Database, Realtime)

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build
- `npm run lint` — run Oxlint
