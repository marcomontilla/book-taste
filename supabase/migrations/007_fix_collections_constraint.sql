-- The original collections_one_wtr constraint was unique(user_id, is_want_to_read),
-- which prevented users from having more than one regular (non-WTR) collection.
-- Replace it with a partial unique index that only enforces one WTR per user.

alter table public.collections
  drop constraint collections_one_wtr;

create unique index collections_one_wtr
  on public.collections (user_id)
  where is_want_to_read = true;
