# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server at http://localhost:5173
npm run build        # tsc + vite build (output: dist/)
npm run type-check   # tsc --noEmit — run before committing
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

**Data flow:** React → Supabase JS client (anon key only) → Postgres with RLS. No backend server. All authorization is enforced by Supabase RLS policies.

**Auth:** `AuthContext` (`src/contexts/AuthContext.tsx`) is the single source of truth for session state. It hydrates from `localStorage` on mount via `getSession()` and stays in sync via `onAuthStateChange`. All auth methods throw on error; pages catch and display errors locally. Google OAuth flow → `/auth/callback` → `AuthCallbackPage`.

**Routing:** React Router v6. Public routes (`/login`, `/signup`, `/auth/callback`) render standalone. All app routes nested under `ProtectedRoute → AppShell` in `App.tsx`. `ProtectedRoute` redirects to `/login` and preserves the intended destination in router state.

**Layout:** `AppShell` renders a persistent top bar (with search button) plus two navs: left sidebar (≥ 768px) and bottom tab bar (< 768px). `<Outlet />` renders into a scrollable `main` area. Shell uses `100dvh` and `env(safe-area-inset-bottom)` for mobile/notch safety.

**Styling:** CSS Modules per component + `src/styles/globals.css` for design tokens (CSS custom properties), reset, and shared utility classes (`.btn`, `.btn-primary`, `.btn-outline`, `.card`, `.form-input`, `.form-label`, `.empty-state`, `.spinner`). No CSS framework. Key tokens: `--color-primary`, `--color-primary-light`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text-muted`, `--color-danger`, `--radius`, `--shadow-sm`.

**TypeScript path alias:** `@/` maps to `src/`. Defined in `tsconfig.json` and `vite.config.ts`.

**DB types:** `src/types/database.ts` holds hand-maintained Supabase-style DB types (Row/Insert/Update/Relationships per table). Must include `Views`, `Functions`, `Enums`, `CompositeTypes` fields (even as `Record<never, never>`) for Supabase JS v2.100+ to type queries correctly. `src/lib/supabase.ts` passes `Database` as a generic to `createClient`.

**Toast:** Global `ToastContext` (`src/contexts/ToastContext.tsx`) provides `showToast(message, type)`. Wrap any component that shows feedback in `ToastProvider` (already at App root). Toasts auto-dismiss after 3.2s.

## Data layer conventions

All Supabase queries go in `src/services/` — pages and components never import `supabase` directly:

| File | Domain |
|---|---|
| `services/books.ts` | Open Library search API + `books` table upsert |
| `services/userBooks.ts` | `user_books` CRUD, reading progress, completion |
| `services/collections.ts` | Collections + WTR collection + collection_books |
| `services/notes.ts` | Notes CRUD |

Custom hooks in `src/hooks/` wrap services into React state:

| Hook | Returns |
|---|---|
| `useLibrary` | User's full library with book joins |
| `useWantToRead` | WTR collection items |
| `useCollections` | All non-WTR collections with book counts |
| `useUserBook(id)` | Single user_book + book, used on detail page |
| `useNotes(userBookId)` | Notes for a user_book, with add/update/remove |
| `useDebounce(value, ms)` | Debounced value — used for auto-save |

## Database

Migrations in `supabase/migrations/` — run in order via Supabase SQL editor or `supabase db push`:

1. `001_schema.sql` — tables and indexes
2. `002_triggers.sql` — auto-create profile + WTR collection on signup; `updated_at`; auto-set `completed_at` when status → 'completed'
3. `003_rls.sql` — RLS policies
4. `004_add_ol_key.sql` — `open_library_key` column on `books` for dedup when no ISBN
5. `005_user_id_defaults.sql` — `DEFAULT auth.uid()` on `user_books`, `collections`, `notes` so services don't need to pass user_id on insert

**Key design decisions:**
- `books` is a shared catalogue (not user-owned). Any authenticated user can read/insert. Dedup order: `isbn_13` → `isbn_10` → `open_library_key`.
- `user_books.status` only allows `'reading'` or `'completed'`. No "want to read" status.
- "Want to Read" is a `collections` row with `is_want_to_read = true`, auto-seeded per user on signup. It cannot be deleted (RLS blocks it). Books in WTR are in `collection_books`, not `user_books`.
- `profiles` insert is handled exclusively by the `handle_new_user` trigger (SECURITY DEFINER) — no frontend insert policy.
- `user_books.completed_at` is auto-set by a trigger; services only toggle `status`.
- `collection_books.Update` is a full update type (not `never`) to satisfy Supabase JS v2.100+ overload resolution.

## Open Library integration

Search endpoint: `https://openlibrary.org/search.json` (no API key required)
Cover images: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`

`searchBooks(query)` in `services/books.ts` fetches and normalizes OL docs into `BookSearchResult` objects. `upsertBook(result)` does the dedup check then inserts. The `olKey` field (`/works/OLxxxxW`) is stored as `open_library_key` for dedup fallback.

## Responsive behavior

| Breakpoint | Nav | Content |
|---|---|---|
| < 768px | Bottom tab bar (4 items) | Full-width |
| ≥ 768px | Left sidebar (220px) + search item | Sidebar + main |

Search is always accessible via the 🔍 button in the top bar (all sizes) and as a sidebar item (desktop).

## Routes

| Path | Component | Notes |
|---|---|---|
| `/library` | `LibraryPage` | Filter by all/reading/completed |
| `/books/:id` | `BookDetailPage` | `:id` is `user_book.id` |
| `/want-to-read` | `WantToReadPage` | Shows collection_books, not user_books |
| `/collections` | `CollectionsPage` | Create/delete collections |
| `/collections/:id` | `CollectionDetailPage` | Rename, remove books |
| `/search` | `SearchPage` | OL search, add to library or WTR |
| `/settings` | `SettingsPage` | Sign out |
