-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- Every user-owned table is locked down to the authenticated user only.
-- The shared `books` table is readable by all authenticated users.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- No insert policy — inserts are done by the trigger (security definer).
-- No delete policy — users cannot delete their own profile directly.


-- ── books (shared catalogue) ──────────────────────────────────────────────────
alter table public.books enable row level security;

create policy "books: read by authenticated users"
  on public.books for select
  to authenticated
  using (true);

create policy "books: insert by authenticated users"
  on public.books for insert
  to authenticated
  with check (true);

-- Updates to book metadata are allowed by any authenticated user.
-- In phase 2 you can restrict this to admins if needed.
create policy "books: update by authenticated users"
  on public.books for update
  to authenticated
  using (true);


-- ── user_books ────────────────────────────────────────────────────────────────
alter table public.user_books enable row level security;

create policy "user_books: select own"
  on public.user_books for select
  using (auth.uid() = user_id);

create policy "user_books: insert own"
  on public.user_books for insert
  with check (auth.uid() = user_id);

create policy "user_books: update own"
  on public.user_books for update
  using (auth.uid() = user_id);

create policy "user_books: delete own"
  on public.user_books for delete
  using (auth.uid() = user_id);


-- ── collections ───────────────────────────────────────────────────────────────
alter table public.collections enable row level security;

create policy "collections: select own"
  on public.collections for select
  using (auth.uid() = user_id);

create policy "collections: insert own"
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "collections: update own"
  on public.collections for update
  using (auth.uid() = user_id);

create policy "collections: delete own (non-WTR only)"
  on public.collections for delete
  using (auth.uid() = user_id and is_want_to_read = false);


-- ── collection_books ──────────────────────────────────────────────────────────
alter table public.collection_books enable row level security;

-- Users can only interact with collection_books for their own collections.
create policy "collection_books: select via own collections"
  on public.collection_books for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "collection_books: insert via own collections"
  on public.collection_books for insert
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "collection_books: delete via own collections"
  on public.collection_books for delete
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );


-- ── notes ─────────────────────────────────────────────────────────────────────
alter table public.notes enable row level security;

create policy "notes: select own"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "notes: insert own"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "notes: update own"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "notes: delete own"
  on public.notes for delete
  using (auth.uid() = user_id);
