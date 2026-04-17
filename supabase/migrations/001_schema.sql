-- ─────────────────────────────────────────────────────────────────────────────
-- BookTaste — initial schema
-- Run this in the Supabase SQL editor (or via supabase db push).
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────────────────
-- One row per auth.users row — created automatically via trigger below.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── books ───────────────────────────────────────────────────────────────────
-- Shared catalogue — not user-owned. One row per unique book.
-- Books are inserted when a user first adds them; no duplicates by ISBN.
create table public.books (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  subtitle      text,
  authors       text[] not null default '{}',
  cover_url     text,
  description   text,
  page_count    integer check (page_count > 0),
  series_name   text,
  series_number numeric,                    -- supports "1.5", "2" etc.
  isbn_10       text,
  isbn_13       text,
  created_at    timestamptz not null default now(),

  constraint books_isbn_10_format check (isbn_10 is null or length(isbn_10) = 10),
  constraint books_isbn_13_format check (isbn_13 is null or length(isbn_13) = 13)
);

create index books_isbn_13_idx on public.books (isbn_13) where isbn_13 is not null;
create index books_isbn_10_idx on public.books (isbn_10) where isbn_10 is not null;

-- ─── user_books ──────────────────────────────────────────────────────────────
-- Join between a user and a book — stores reading state.
create table public.user_books (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  book_id      uuid not null references public.books(id) on delete cascade,
  current_page integer not null default 0 check (current_page >= 0),
  total_pages  integer check (total_pages > 0),
  status       text not null default 'reading' check (status in ('reading', 'completed')),
  date_added   timestamptz not null default now(),
  completed_at timestamptz,                -- null until user marks complete

  unique (user_id, book_id)               -- a user can only add a book once
);

create index user_books_user_id_idx on public.user_books (user_id);

-- ─── collections ─────────────────────────────────────────────────────────────
-- User-created groupings. is_want_to_read flags the special WTR list.
-- One WTR collection is auto-created per user via trigger below.
create table public.collections (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  is_want_to_read boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- enforce exactly one WTR collection per user
  constraint collections_one_wtr unique nulls not distinct (user_id, is_want_to_read)
    deferrable initially deferred
);

create index collections_user_id_idx on public.collections (user_id);

-- ─── collection_books ────────────────────────────────────────────────────────
create table public.collection_books (
  id            uuid primary key default uuid_generate_v4(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  book_id       uuid not null references public.books(id) on delete cascade,
  added_at      timestamptz not null default now(),

  unique (collection_id, book_id)
);

create index collection_books_collection_id_idx on public.collection_books (collection_id);

-- ─── notes ───────────────────────────────────────────────────────────────────
create table public.notes (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  user_book_id uuid not null references public.user_books(id) on delete cascade,
  content      text not null,
  page_number  integer check (page_number > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index notes_user_book_id_idx on public.notes (user_book_id);
