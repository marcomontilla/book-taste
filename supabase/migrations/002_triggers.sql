-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Auto-create profile row on new auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- Seed the user's "Want to Read" collection automatically
  insert into public.collections (user_id, name, is_want_to_read)
  values (new.id, 'Want to Read', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Keep updated_at current on profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger collections_updated_at
  before update on public.collections
  for each row execute procedure public.set_updated_at();

create trigger notes_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();


-- 3. Auto-set completed_at when status flips to 'completed'
create or replace function public.handle_book_completed()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    new.completed_at = now();
  end if;
  if new.status = 'reading' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger user_books_completed
  before update on public.user_books
  for each row execute procedure public.handle_book_completed();
