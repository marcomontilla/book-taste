-- Set DEFAULT auth.uid() on all user_id columns so the frontend
-- never has to pass user_id explicitly on insert.
-- RLS policies still enforce that the row belongs to the caller.

alter table public.user_books  alter column user_id set default auth.uid();
alter table public.collections alter column user_id set default auth.uid();
alter table public.notes       alter column user_id set default auth.uid();
