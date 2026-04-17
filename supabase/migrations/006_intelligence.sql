-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3: cached intelligence tables
--
-- Both tables are user-scoped: insights are personalised to each reader's
-- history, so sharing them globally would produce wrong results.
-- ─────────────────────────────────────────────────────────────────────────────

-- Per-user, per-book insight cache (why like / why dislike).
-- One row per (user, book). Upsert on refresh.
create table public.book_insights (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  book_id               uuid not null references public.books(id)    on delete cascade,
  like_reason           text,
  dislike_reason        text,
  generated_from_source text not null default 'on_demand',  -- 'on_demand' | 'post_scan'
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (user_id, book_id)
);

create index book_insights_user_book_idx on public.book_insights (user_id, book_id);

-- Per-user recommendation cache.
-- source_book_id is null for profile-level (general) recommendations.
-- recommendation_type: 'similar' | 'blind_side' | 'general'
-- payload_json stores the item list as jsonb for flexibility.
create table public.book_recommendations (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  source_book_id      uuid references public.books(id) on delete cascade,
  recommendation_type text not null
    check (recommendation_type in ('similar', 'blind_side', 'general')),
  payload_json        jsonb not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index book_recs_user_source_idx
  on public.book_recommendations (user_id, source_book_id)
  where source_book_id is not null;

create index book_recs_user_general_idx
  on public.book_recommendations (user_id)
  where source_book_id is null;

-- updated_at trigger (reuses existing function from migration 002)
create trigger book_insights_updated_at
  before update on public.book_insights
  for each row execute procedure public.set_updated_at();

create trigger book_recommendations_updated_at
  before update on public.book_recommendations
  for each row execute procedure public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.book_insights enable row level security;

create policy "book_insights: select own"
  on public.book_insights for select using (auth.uid() = user_id);

create policy "book_insights: insert own"
  on public.book_insights for insert with check (auth.uid() = user_id);

create policy "book_insights: update own"
  on public.book_insights for update using (auth.uid() = user_id);

create policy "book_insights: delete own"
  on public.book_insights for delete using (auth.uid() = user_id);


alter table public.book_recommendations enable row level security;

create policy "book_recommendations: select own"
  on public.book_recommendations for select using (auth.uid() = user_id);

create policy "book_recommendations: insert own"
  on public.book_recommendations for insert with check (auth.uid() = user_id);

create policy "book_recommendations: delete own"
  on public.book_recommendations for delete using (auth.uid() = user_id);
