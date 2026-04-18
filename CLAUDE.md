# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server at http://localhost:5173
npm run build        # tsc + vite build (output: dist/)
npm run type-check   # tsc --noEmit — run before committing
npm run preview      # serve the dist/ build locally
```

No tests. `type-check` is the verification gate — run it before every commit. `npm run lint` is configured but the ESLint config file is missing (pre-existing issue); don't block on it.

For mobile testing via ngrok:
```bash
ngrok http http://localhost:5173   # must use full URL, not just port
```

## Environment

Copy `.env.example` → `.env` before running:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app throws at startup if either is missing (`src/lib/supabase.ts`). Never commit `.env`. Never use the service role key on the frontend.

## Architecture

**Stack:** React 18 + TypeScript + Vite, Supabase JS v2 (auth + postgres), React Router v6, CSS Modules, lucide-react icons. No backend server. No state management library.

**Data flow:** React → Supabase JS client (anon key) → Postgres with RLS. All authorization is at the database level via RLS policies — the frontend is never trusted.

**Auth:** `AuthContext` (`src/contexts/AuthContext.tsx`) is the single session source of truth. Hydrates from localStorage via `getSession()` on mount, stays in sync via `onAuthStateChange`. All auth methods throw on error; callers catch and display locally. Google OAuth redirects through `/auth/callback` → `AuthCallbackPage`.

**Routing:** All app routes nested under `ProtectedRoute → AppShell` in `App.tsx`. `ProtectedRoute` redirects unauthenticated users to `/login`, preserving the intended destination in router state.

**Layout:** `AppShell` renders a top bar + left sidebar (≥ 768px) + bottom tab bar (< 768px). Icons use lucide-react (consistent stroke style — no emoji icons in nav). Avatar button navigates to `/settings`. `<Outlet />` renders into a scrollable `main`. Shell uses `100dvh` and `env(safe-area-inset-bottom)` for mobile/notch safety.

**Theming:** `ThemeContext` (`src/contexts/ThemeContext.tsx`) applies `data-theme="dark"` to `<html>`. Modes: `light | dark | system`. Persisted to `localStorage`. All colours must go through CSS custom properties — no hardcoded hex in CSS modules.

**i18n:** `react-i18next` with `en` and `es` locales in `src/i18n/locales/`. Language persisted to `localStorage`. The edge function also receives the current language and responds in that language.

**Styling:** CSS Modules per component + `src/styles/globals.css` for design tokens, reset, and shared utility classes. No CSS framework. Palette is the **Zulia** theme.

Key CSS custom properties (defined in `globals.css`):
```
--color-primary        #0080C8   (dark: #3399E0)
--color-primary-hover  #0068A8
--color-primary-dark   #004E80
--color-primary-light  #E6F3FB   (dark: rgba(0,128,200,0.15))
--color-accent         #FFCC00
--color-bg             #F4F7FA   (dark: #070A0F)
--color-surface        #FFFFFF   (dark: #0E1420)
--color-surface-raised #E8EEF5   (dark: #151E30)
--color-border         #C8D5E0   (dark: #1E2D40)
--color-text           #0D1520   (dark: #F0F4F8)
--color-text-muted     #4E6070   (dark: #8896A8)
--color-danger         #D93025   (dark: #F87171)
--color-danger-light   #FDECEA   (dark: #2D1515)
--color-success        #1A7A4A   (dark: #4ADE80)
--color-warning        #B45309   (dark: #F59E0B)
--color-warning-light  #FEF9EC   (dark: #2D1F08)
--topbar-height        3.5rem
--bottomnav-height     3.75rem
--radius / --radius-sm / --radius-xs
--shadow-sm / --shadow
--transition           0.15s ease
```

Primary button uses gradient: `linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))`.

Shared utility classes (use these, don't re-invent): `.btn`, `.btn-primary`, `.btn-outline`, `.btn-secondary`, `.form-input`, `.form-label`, `.form-field`, `.form-error`, `.card`, `.empty-state`, `.empty-state-icon/title/body`, `.spinner`, `.splash`.

**TypeScript path alias:** `@/` → `src/`. Defined in both `tsconfig.json` and `vite.config.ts`.

**DB types:** `src/types/database.ts` is hand-maintained (not generated). Must include `Views`, `Functions`, `Enums`, `CompositeTypes` as `Record<never, never>` and each table must have a `Relationships` array — required for Supabase JS v2.100+ to resolve insert/update types correctly. If a table's `Update` type is `never`, change it to a full partial type or Supabase's overload resolution breaks.

**Toast:** `ToastContext` (`src/contexts/ToastContext.tsx`) provides `useToast()` → `showToast(message, type?)`. Already mounted at App root via `ToastProvider`. Auto-dismisses after 3.2s.

## Data layer conventions

Pages and components never import `supabase` directly. All queries go through:

| File | Domain |
|---|---|
| `src/services/books.ts` | OL search, ISBN lookup, `books` upsert, OL enrichment, author works, series books |
| `src/services/userBooks.ts` | `user_books` CRUD, progress, completion toggle, remove |
| `src/services/collections.ts` | Collections + WTR + `collection_books` membership |
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
| `007_fix_collections_constraint.sql` | Replaces `UNIQUE(user_id, is_want_to_read)` with a partial unique index on `is_want_to_read = true` — fixes the bug where users could only create one regular collection |

**Key design decisions — do not change without considering these:**

- `books` is a **shared catalogue**, not user-owned. Any authenticated user can read/insert. Dedup on insert: `isbn_13` → `isbn_10` → `open_library_key` (in that priority order).
- `user_books.status` accepts only `'reading'` or `'completed'`. There is no third status. "Want to Read" is not a status.
- **"Want to Read"** is a `collections` row with `is_want_to_read = true`, auto-seeded per user by the signup trigger. RLS blocks deletion of it. Books in WTR live in `collection_books`, not `user_books` — the two lists are independent.
- `profiles` has no insert RLS policy. Inserts happen only via the `handle_new_user` trigger (SECURITY DEFINER).
- `user_books.completed_at` is set/cleared automatically by a DB trigger when `status` changes. Services only write `status`, never `completed_at`.
- `DEFAULT auth.uid()` on user_id columns (migration 005) means service insert calls never need to pass `user_id` explicitly — Postgres fills it from the active session.
- **`createCollection` must explicitly pass `is_want_to_read: false`**. Always: `insert({ name, is_want_to_read: false })`. Migration 007 fixed the underlying constraint (was `UNIQUE(user_id, is_want_to_read)` which blocked multiple regular collections; now a partial index on `is_want_to_read = true` only).

## Open Library integration

- Search: `GET https://openlibrary.org/search.json?q={query}&fields=...` — no API key
- Covers: `https://covers.openlibrary.org/b/id/{cover_i}-{S|M|L}.jpg` — use `-M` for lists, `-L` for lightbox
- The OL work key (`/works/OLxxxxxW`) is stored as `open_library_key` as the dedup fallback when no ISBN exists.
- `lookupByIsbn(isbn)` in `services/books.ts`: checks DB first by `isbn_13`/`isbn_10`, then falls back to OL search.

**OL enrichment** (`fetchOLDetails` in `services/books.ts`): fetches additional metadata for the book detail page. Fields: `ratings_average`, `ratings_count`, `publisher`, `language`, `subject`, `ebook_access`, `first_publish_year`, `series`, `series_key`. Used to show rating, publisher, ebook badge, subject chips, series name fallback, and series book strip. Returns `seriesKey` (e.g. `OL326110L`) used to fetch the full series.

**Author works** (`fetchAuthorWorks` in `services/books.ts`): searches OL by author name, sorted by `editions` (popularity proxy), deduplicates by title, returns up to 8 results excluding the current book. Displayed in `AuthorWorksSection` as a horizontal scroll strip.

**Series books** (`fetchSeriesBooks` in `services/books.ts`): calls `/series/{seriesKey}/seeds.json`, filters to `type: "work"`, excludes the current book. Displayed in `SeriesBooksSection` (shares `AuthorWorksSection.module.css`). Only shown when `olDetails.seriesKey` is available. Cover URLs from seeds use `//` protocol-relative prefix + `-S.jpg`; upgraded to `https:` + `-M.jpg`.

**Subject normalisation** (`normalizeSubjects` in `BookDetailPage.tsx`): OL subjects include internal noise (`Serie:*`, underscore keys, `nyt:*`, `Accessible book`, etc.). The function strips these, title-cases remaining tags, deduplicates, and limits to 6.

**Series fallback:** `book.series_name` may be null for books added before series parsing. The hero falls back to `olDetails?.series` so the series label always appears when OL knows about it.

**Description normalisation** (`normalizeDescription` in `services/books.ts`): OL works API returns descriptions with `\r\n\r\n` paragraph separators and appended noise (`([source][1])`, `----------`, `See also:`). The function normalises line endings, splits into paragraphs, strips noise on `(source)` / `----` / `See also` boundaries, strips markdown links and formatting, and limits to 6 paragraphs. Rendered as individual `<p>` elements in `BookDetailPage`.

## Barcode scanning

- `services/scanner.ts` wraps `@zxing/browser` (`BrowserMultiFormatReader`) — prefers rear/environment camera.
- All decode-loop callback errors are silenced (they are normal `NotFoundException` noise from zxing, but checking `.name` doesn't work on plain Error objects — ignore everything in the error slot).
- `ScanPage` uses `detectedRef = useRef(false)` to prevent multiple `onDetect` fires before state update propagates. Reset `detectedRef.current = false` when "Scan again" is pressed.
- Flow: camera open → detect → ISBN lookup → show result card → "Add to library" → `upsertBook` then `addToLibrary` → navigate to `/books/${userBook.id}`.

## Book Intelligence (AI)

- **Edge function:** `supabase/functions/generate-insights/index.ts` (Deno). Calls Claude Haiku with book metadata + up to 12 completed book titles.
- **Prompt design:** `similar` picks are chosen based on the **current book's genre, themes, and writing style** — not the reader's history. Reading history is used only to personalise the `reason` field for each pick. `blind_side` is a different-genre pick. `like_reason`/`dislike_reason` are personalised to the reader's history.
- **Deploy:** always from project root with `--no-verify-jwt` (see gotchas).
- **Cache-first:** `book_insights` (upsert on user_id+book_id) + `book_recommendations` (delete+insert). Edge function only called when user clicks "Generate" or "Refresh" — never in background.
- **Cost:** ~$0.001/generation (Claude Haiku). Safe for free-tier.
- **Language:** the frontend passes `language: i18n.language` in the request body; Claude responds in that language.
- Clicking a recommendation item navigates to `/search?q=title+author` — `SearchPage` auto-searches on `?q=` param.

## Collections flow

- **List page** (`CollectionsPage`): create via modal, rename via pencil icon per card, delete via trash icon per card. Both rename and delete are inline — no need to enter the collection.
- **Detail page** (`CollectionDetailPage`): "Add books" button opens a modal showing the user's full library with search filter. Books already in the collection show "✓ Added". Remove books via ✕ per row.
- **Book detail page**: Collections section is always rendered (shows a hint when the user has no collections). Toggling a pill adds/removes the book from that collection.

## UI behaviours to preserve

- **Progress auto-save:** debounces `currentPage` via `useDebounce(currentPage, 1000)` and writes to Supabase when the debounced value differs from the server value. No save button.
- **Progress disabled when completed:** `status === 'completed'` wraps the progress area in `.progressDisabled` (opacity 0.45 + pointer-events none). Page value is preserved so unchecking "completed" restores it immediately.
- **Cover lightbox:** tapping the book cover on the detail page opens a full-screen overlay. Large cover URL: replace `-M.jpg` with `-L.jpg` in the OL cover URL. Close on backdrop click or Escape.
- **Note creation is intentional:** "Add note" button must be clicked to show the form. Saving is explicit (Save button). Editing auto-saves with a 1s debounce.
- **Search result add buttons:** each card tracks its own `'idle' | 'loading' | 'done'` state. After a successful add the button permanently flips to "✓ In Library" / "✓ Saved" for that session.
- **WTR → Library flow:** "Start reading" calls `addToLibrary(bookId)` then `removeFromWantToRead(collectionBookId)` — book moves from `collection_books` to `user_books`.
- **SearchPage auto-search:** navigating to `/search?q=some+query` pre-fills the input and auto-triggers the search. Used by recommendation taps and author work taps.

## Responsive breakpoints

| Width | Navigation |
|---|---|
| < 768px | Bottom tab bar |
| ≥ 768px | Left sidebar (220px) |

Search and Scan are accessible at all sizes via top bar buttons and sidebar nav items.

## Known deployment gotchas

**1. Edge function deploy: must run from project root**
```bash
cd C:\Users\marco\dev\book-taste
npx supabase functions deploy generate-insights --no-verify-jwt
```

**2. Edge function: always deploy with `--no-verify-jwt`**
Newer Supabase projects issue JWTs signed with ES256. The edge runtime rejects them with `UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM`. Safe to skip because RLS enforces all data access at the DB level.

**3. New user-scoped tables need `DEFAULT auth.uid()` set manually**
Migration 005 added the default to existing tables. Any table created after it must run:
```sql
alter table public.<table_name>
  alter column user_id set default auth.uid();
```
Otherwise insert RLS policies that check `auth.uid() = user_id` fail with `42501`.

**4. Full edge function deploy sequence**
```bash
cd C:\Users\marco\dev\book-taste
npx supabase link                  # once per machine, needs project ref from dashboard
npx supabase functions deploy generate-insights --no-verify-jwt
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

**5. Vercel deployment (production)**
Production URL: `https://book-taste-woad.vercel.app`
`vercel.json` rewrites all routes to `index.html` — required for React Router (without it, any non-root route returns 404).
Env vars must be set in Vercel dashboard before deploying: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
```bash
vercel --prod
```
OAuth redirect URL (add in Supabase Auth → URL Configuration and Google Cloud Console):
```
https://book-taste-woad.vercel.app/auth/callback
```

**6. `createCollection` must pass `is_want_to_read: false`**
Always insert with `{ name, is_want_to_read: false }`. Migration 007 fixed the underlying DB constraint (was `UNIQUE(user_id, is_want_to_read)` which allowed only one regular collection per user; replaced with a partial unique index restricted to `is_want_to_read = true`). Run migration 007 in Supabase SQL editor if not yet applied.

**7. Mobile testing via ngrok**
Google OAuth won't work with ngrok unless you add the ngrok URL to Supabase redirect URLs and Google OAuth authorized URIs each session (URL changes on restart). Use the Vercel production URL for real testing instead.

## Book discovery flow

**Search / any list → click → preview → add action → full detail**

- Clicking a book from search results or Want to Read navigates to `/books/preview` with the `BookSearchResult` (or equivalent) passed as router state.
- **Library books** go directly to `/books/:id` (no preview step — already in library).
- `BookPreviewPage` (`src/pages/BookPreviewPage.tsx`) fetches OL details on mount (description, rating, subjects) and shows two action buttons:
  - Normal book: "Add to Library" → upserts + adds → navigates to `/books/{userBookId}`; "Want to Read" → upserts + saves → goes back
  - WTR book (state has `wtrCollectionBookId`): "Start Reading" → adds to library + removes from WTR → navigates to detail; "Remove from Want to Read" → removes → goes back
- WTR items already have a DB `bookId` in state — `upsertBook` is skipped, only `addToLibrary` is called.
- `SearchResultCard` is now a pure navigation button (no inline add buttons).
- `/books/preview` must be declared **before** `/books/:id` in the router so it isn't caught by the dynamic segment.

## Routes

| Path | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/signup` | `SignUpPage` | Public |
| `/auth/callback` | `AuthCallbackPage` | OAuth redirect handler |
| `/library` | `LibraryPage` | Filter: all / reading / completed |
| `/books/preview` | `BookPreviewPage` | Book preview before adding; state: `{ book: BookSearchResult, bookId?, wtrCollectionBookId? }` |
| `/books/:id` | `BookDetailPage` | `:id` is `user_book.id`, not `book.id` |
| `/want-to-read` | `WantToReadPage` | `collection_books` list — items navigate to preview |
| `/collections` | `CollectionsPage` | Create / rename / delete collections |
| `/collections/:id` | `CollectionDetailPage` | Add books from library, rename, remove books |
| `/search` | `SearchPage` | OL search → click card → preview; accepts `?q=` param |
| `/scan` | `ScanPage` | Barcode scanner → ISBN lookup → add to library |
| `/settings` | `SettingsPage` | Theme (light/dark/system), language (EN/ES), sign out |
