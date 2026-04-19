-- Add rating (1-5, optional) and is_favorite to user_books
alter table public.user_books
  add column rating smallint check (rating between 1 and 5),
  add column is_favorite boolean not null default false;

-- Lightweight reading sessions: auto-logged when progress updates
create table public.reading_sessions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  user_book_id uuid       not null references public.user_books(id) on delete cascade,
  page_at     integer     not null,
  recorded_at timestamptz not null default now()
);

create index reading_sessions_user_book_idx on public.reading_sessions (user_book_id);
create index reading_sessions_user_idx       on public.reading_sessions (user_id, recorded_at desc);

alter table public.reading_sessions enable row level security;

create policy "Users can manage own reading sessions"
  on public.reading_sessions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
