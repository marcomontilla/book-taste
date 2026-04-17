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

No tests yet. Type-check and lint are the verification gates.

For mobile testing via ngrok (dev server is configured to accept all hosts):
```bash
ngrok http http://localhost:5173
```
Note: must use `http://localhost:5173` not just `5173` — ngrok needs the explicit scheme.

## Environment

Copy `.env.example` → `.env` before running:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app throws at startup if either is missing (`src/lib/supabase.ts`). Never commit `.env`. Never use the service role key on the frontend.

## Architecture

**Stack:** React 18 + TypeScript + Vite, Supabase JS v2 (auth + postgres), React Router v6, CSS Modules. No backend server. No state management library.

**Data flow:** React → Supabase JS client (anon key) → Postgres with RLS. All authorization is at the database level via RLS policies — the frontend is never trusted.

**Auth:** `AuthContext` (`src/contexts/AuthContext.tsx`) is the single session source of truth. Hydrates from localStorage via `getSession()` on mount, stays in sync via `onAuthStateChange`. All auth methods throw on error; callers catch and display locally. Google OAuth redirects through `/auth/callback` → `AuthCallbackPage`.

**Routing:** All app routes nested under `ProtectedRoute → AppShell` in `App.tsx`. `ProtectedRoute` redirects unauthenticated users to `/login`, preserving the intended destination in router state.

**Layout:** `AppShell` renders a top bar (with 🔍 search button) + left sidebar (≥ 768px) + bottom tab bar (< 768px). `<Outlet />` renders into a scrollable `main`. Shell uses `100dvh` and `env(safe-area-inset-bottom)` for mobile/notch safety. Designed for future Capacitor packaging.

**Styling:** CSS Modules per component + `src/styles/globals.css` for design tokens, reset, and shared utility classes. No CSS framework.

Key CSS custom properties (defined in `globals.css`):
```
--color-primary        #4f46e5
--color-primary-light  #eef2ff
--color-bg             #f8f8fa
--color-surface        #ffffff
--color-border         #e5e7eb
--color-text           #111827
--color-text-muted     #6b7280
--color-danger         #ef4444
--topbar-height        3.5rem
--bottomnav-height     3.75rem
--radius / --radius-sm
--shadow-sm / --shadow
```

Shared utility classes (use these, don't re-invent): `.btn`, `.btn-primary`, `.btn-outline`, `.form-input`, `.form-label`, `.form-field`, `.form-error`, `.card`, `.empty-state`, `.empty-state-icon/title/body`, `.spinner`, `.splash`.

**TypeScript path alias:** `@/` → `src/`. Defined in both `tsconfig.json` and `vite.config.ts`.

**DB types:** `src/types/database.ts` is hand-maintained (not generated). Must include `Views`, `Functions`, `Enums`, `CompositeTypes` as `Record<never, never>` and each table must have a `Relationships` array — required for Supabase JS v2.100+ to resolve insert/update types correctly. If a table's `Update` type is `never`, change it to a full partial type or Supabase's overload resolution breaks.

**Toast:** `ToastContext` (`src/contexts/ToastContext.tsx`) provides `useToast()` → `showToast(message, type?)`. Already mounted at App root via `ToastProvider`. Auto-dismisses after 3.2s.

## Data layer conventions

Pages and components never import `supabase` directly. All queries go through:

| File | Domain |
|---|---|
| `src/services/books.ts` | Open Library search API + `books` table upsert + ISBN lookup |
| `src/services/userBooks.ts` | `user_books` CRUD, progress, completion toggle, remove |
| `src/services/collections.ts` | Collections + WTR + collection_books membership |
| `src/services/notes.ts` | Notes CRUD |
| `src/services/scanner.ts` | `@zxing/browser` barcode scanner — `startScan`, `stopScan`, `lookupByIsbn` |
| `src/services/intelligence.ts` | Cache reads/writes for `book_insights` + `book_recommendations`; calls `generate-insights` edge function |

Hooks in `src/hooks/` wrap services into React state:

| Hook | Purpose |
|---|---|
| `useLibrary` | Full library (`user_books` joined with `books`) |
| `useWantToRead` | WTR collection items (books, not user_books) |
| `useCollections` | All non-WTR collections with book counts |
| `useUserBook(id)` | Single `user_book` + book for the detail page |
| `useNotes(userBookId)` | Notes list with `add`, `update`, `remove` mutations |
| `useDebounce(value, ms)` | Debounced value — drives auto-save in the detail page |
| `useInsights(bookId)` | Loads cached insights + recommendations; exposes `generate()` for on-demand AI call |

## Database

All migrations in `supabase/migrations/` — must be run in order via Supabase SQL editor or `supabase db push`:

| File | What it does |
|---|---|
| `001_schema.sql` | All tables + indexes |
| `002_triggers.sql` | Auto-create profile + WTR collection on signup; `updated_at`; auto-set `completed_at` when status → 'completed' |
| `003_rls.sql` | RLS policies for all tables |
| `004_add_ol_key.sql` | `open_library_key` column on `books` for ISBN-less dedup |
| `005_user_id_defaults.sql` | `DEFAULT auth.uid()` on `user_books`, `collections`, `notes` |
| `006_intelligence.sql` | `book_insights` and `book_recommendations` tables + RLS |

**Key design decisions — do not change without considering these:**

- `books` is a **shared catalogue**, not user-owned. Any authenticated user can read/insert. Dedup on insert: `isbn_13` → `isbn_10` → `open_library_key` (in that priority order).
- `user_books.status` accepts only `'reading'` or `'completed'`. There is no third status. "Want to Read" is not a status.
- **"Want to Read"** is a `collections` row with `is_want_to_read = true`, auto-seeded per user by the signup trigger. RLS blocks deletion of it. Books in WTR live in `collection_books`, not `user_books` — the two lists are independent.
- `profiles` has no insert RLS policy. Inserts happen only via the `handle_new_user` trigger (SECURITY DEFINER).
- `user_books.completed_at` is set/cleared automatically by a DB trigger when `status` changes. Services only write `status`, never `completed_at`.
- `DEFAULT auth.uid()` on user_id columns (migration 005) means service insert calls never need to pass `user_id` explicitly — Postgres fills it from the active session.

## Open Library integration

- Search: `GET https://openlibrary.org/search.json?q={query}&fields=...` — no API key
- Covers: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg` (S/M/L sizes)
- The OL work key (`/works/OLxxxxxW`) is stored as `open_library_key` as the dedup fallback when no ISBN exists.
- `lookupByIsbn(isbn)` in `services/books.ts`: checks DB first by `isbn_13`/`isbn_10`, then falls back to OL search. Used by `ScanPage`.

## Barcode scanning

- `services/scanner.ts` wraps `@zxing/browser` (`BrowserMultiFormatReader`) — prefers rear/environment camera, ignores `NotFoundException`.
- `ScannerView` component: renders `<video>` + viewfinder overlay with corner brackets and animated sweep line.
- `ScanPage` flow: camera open → detect → ISBN lookup → show result card → "Add to library" calls `upsertBook` then `addToLibrary` → navigate to book detail.
- Scan button (📷) in top bar and sidebar. Route: `/scan`.

## Book Intelligence (AI)

- **Edge function:** `supabase/functions/generate-insights/index.ts` (Deno). Calls Claude Haiku with book metadata + up to 12 completed book titles. Returns `{ like_reason, dislike_reason, similar: [{title, author, reason}], blind_side: {title, author, reason} }`.
- **Deploy:** `supabase functions deploy generate-insights` + `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
- **Cache-first:** `book_insights` (upsert on user_id+book_id) + `book_recommendations` (delete+insert). The edge function is only called when the user explicitly clicks "Generate insights" or "Refresh" — never in the background.
- **Cost:** ~$0.001/generation (Claude Haiku). Safe for free-tier — never auto-triggered.
- `IntelligencePanel` is rendered in `BookDetailPage` below notes. It receives `userBook` and the current user's completed books list (fetched from `getLibrary()` on mount).

## UI behaviours to preserve

- **Progress auto-save:** `BookDetailPage` debounces `currentPage` via `useDebounce(currentPage, 1000)` and writes to Supabase when the debounced value differs from the server value. No save button.
- **Progress disabled when completed:** When `status === 'completed'`, the progress area (bar + page input) is wrapped in `.progressDisabled` (opacity 0.45 + pointer-events none). The page value is preserved so unchecking "completed" restores it immediately.
- **Note creation is intentional:** The "Add note" button must be clicked to show the form. Saving is also explicit (Save button). Editing an existing note auto-saves with a 1s debounce.
- **Search result add buttons:** Each result card tracks its own `'idle' | 'loading' | 'done'` state per button. After a successful add the button permanently flips to "✓ In Library" / "✓ Saved" for that session.
- **WTR → Library flow:** "Start reading" in `WantToReadPage` calls `addToLibrary(bookId)` then `removeFromWantToRead(collectionBookId)` — the book moves from `collection_books` to `user_books`.

## Responsive breakpoints

| Width | Navigation | Modal style |
|---|---|---|
| < 480px | Bottom tabs | Form rows stack vertically (e.g. note form) |
| < 640px | Bottom tabs | Modal slides up as a bottom sheet |
| 640–767px | Bottom tabs | Modal is a centred dialog |
| ≥ 768px | Left sidebar (220px) | Modal is a centred dialog |

Search (🔍) and Scan (📷) are accessible at all sizes via the top bar buttons, and also as sidebar nav items on desktop.

## Known deployment gotchas

Issues we have hit in production — check these before debugging further.

**1. Edge function deploy: must run from project root**
`supabase functions deploy` looks for `supabase/functions/` relative to the current directory.
Always run from `C:\Users\marco\dev\book-taste`, not from `C:\Users\marco` or anywhere else.
```bash
cd C:\Users\marco\dev\book-taste
supabase functions deploy generate-insights --no-verify-jwt
```

**2. Edge function: always deploy with `--no-verify-jwt`**
Newer Supabase projects issue JWTs signed with ES256. The edge function runtime rejects them with
`UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM`. The `--no-verify-jwt` flag skips runtime JWT verification.
This is safe because all data writes go through the frontend with RLS enforced at the DB level.

**3. New tables after migration 005 need `DEFAULT auth.uid()` added manually**
Migration 005 added `DEFAULT auth.uid()` to the existing tables. Any table created after that (e.g.
`book_insights`, `book_recommendations`) must have the default set explicitly, otherwise insert RLS
policies that check `auth.uid() = user_id` will fail with `42501` because `user_id` is null.
After creating a new user-scoped table, always run:
```sql
alter table public.<table_name>
  alter column user_id set default auth.uid();
```

**4. Full edge function deploy sequence**
```bash
cd C:\Users\marco\dev\book-taste
supabase functions deploy generate-insights --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

**5. Vercel deployment (production)**
Production URL: `https://book-taste-woad.vercel.app`
`vercel.json` rewrites all routes to `index.html` — required for React Router to work (without it, any route other than `/` returns 404).
Environment variables must be set in Vercel dashboard (Settings → Environment Variables) before deploying:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Deploy command:
```bash
vercel --prod
```

OAuth redirect URL to add in Supabase (Auth → URL Configuration) and Google Cloud Console:
```
https://book-taste-woad.vercel.app/auth/callback
```

**6. Mobile testing via ngrok**
Google OAuth won't work with ngrok unless you add the ngrok URL to both Supabase redirect URLs and Google OAuth authorized redirect URIs each session. Use the production Vercel URL for real testing instead. If you do need ngrok:
```bash
ngrok http http://localhost:5173   # must use full http://localhost:5173, not just port
```

## Routes

| Path | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/signup` | `SignUpPage` | Public |
| `/auth/callback` | `AuthCallbackPage` | OAuth redirect handler |
| `/library` | `LibraryPage` | Filter: all / reading / completed |
| `/books/:id` | `BookDetailPage` | `:id` is `user_book.id`, not `book.id` |
| `/want-to-read` | `WantToReadPage` | `collection_books` list, not `user_books` |
| `/collections` | `CollectionsPage` | Create / delete collections |
| `/collections/:id` | `CollectionDetailPage` | Rename, remove individual books |
| `/search` | `SearchPage` | OL search → add to library or WTR |
| `/scan` | `ScanPage` | Barcode scanner → ISBN lookup → add to library |
| `/settings` | `SettingsPage` | Shows email, sign out |
