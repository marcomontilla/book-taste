# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server at http://localhost:5173
npm run build        # tsc + vite build (output: dist/)
npm run type-check   # tsc --noEmit, no emit — use before committing
npm run lint         # eslint, zero warnings policy
npm run preview      # serve the dist/ build locally
```

There are no tests yet. Type-check and lint are the verification gates.

## Environment

Copy `.env.example` → `.env` and fill in two values before `npm run dev` will work:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The app throws at startup if either is missing (`src/lib/supabase.ts`).

## Architecture

**Data flow:** React → Supabase JS client (anon key only) → Postgres with RLS. There is no backend server. All authorization is enforced by Supabase RLS policies; the frontend never uses the service role key.

**Auth:** `AuthContext` (`src/contexts/AuthContext.tsx`) is the single source of truth for session state. It hydrates from `localStorage` on mount via `getSession()` and stays in sync via `onAuthStateChange`. All auth methods throw on error; pages catch and display errors locally. The Google OAuth flow redirects through `/auth/callback`, handled by `AuthCallbackPage`.

**Routing:** React Router v6. Public routes (`/login`, `/signup`, `/auth/callback`) render standalone. All app routes are nested under `ProtectedRoute → AppShell` in `App.tsx`. `ProtectedRoute` redirects to `/login` and preserves the intended destination in router state.

**Layout:** `AppShell` renders a persistent top bar plus two navs — a left sidebar (visible ≥ 768px) and a bottom tab bar (visible < 768px). The `<Outlet />` renders into a scrollable `main` area. The shell uses `100dvh` and `env(safe-area-inset-bottom)` for mobile/notch safety.

**Styling:** CSS Modules per component + `src/styles/globals.css` for design tokens (CSS custom properties), reset, and utility classes (`.btn`, `.card`, `.form-input`, `.empty-state`, etc.). No CSS framework. Token names: `--color-primary`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text-muted`, `--radius`, `--shadow-sm`.

**TypeScript path alias:** `@/` maps to `src/`. Defined in `tsconfig.json` and `vite.config.ts`.

**DB types:** `src/types/database.ts` holds hand-maintained Supabase-style DB types (Row/Insert/Update per table). `src/lib/supabase.ts` passes `Database` as a generic to `createClient` for typed queries.

## Database

Migrations live in `supabase/migrations/` and must be run in order via the Supabase SQL editor or `supabase db push`:

1. `001_schema.sql` — tables and indexes
2. `002_triggers.sql` — three triggers: auto-create profile + WTR collection on signup; `updated_at` maintenance; auto-set `completed_at` when `status` flips to `'completed'`
3. `003_rls.sql` — RLS policies

**Key design decisions:**
- `books` is a shared catalogue (not user-owned). Any authenticated user can read/insert. Deduplication across users is by ISBN.
- `user_books.status` only allows `'reading'` or `'completed'`. There is no "want to read" status.
- "Want to Read" is a `collections` row with `is_want_to_read = true`, auto-seeded per user by the signup trigger. It cannot be deleted (RLS blocks `delete where is_want_to_read = true`). A unique constraint on `(user_id, is_want_to_read)` prevents duplicates.
- `profiles` has no insert RLS policy — inserts are done exclusively by the `handle_new_user` trigger (`SECURITY DEFINER`).

## Adding features

When adding Supabase queries in phase 2, put them in `src/services/` (one file per domain: `books.ts`, `userBooks.ts`, `collections.ts`, `notes.ts`). Pages and components should not call `supabase` directly.
