-- Add Open Library key to books for deduplication when no ISBN is present
alter table public.books add column if not exists open_library_key text;

create index if not exists books_ol_key_idx
  on public.books (open_library_key)
  where open_library_key is not null;
