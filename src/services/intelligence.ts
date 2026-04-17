// Intelligence service — cache read/write + on-demand generation via edge function.
//
// Architecture:
//   1. Always check DB cache first (instant, free).
//   2. Only call the edge function when cache is missing or user requests refresh.
//   3. Write results back to DB; next load hits the cache.
//
// The edge function (supabase/functions/generate-insights) calls Claude Haiku.
// AI cost is ~$0.001 per generation — only incurred when user explicitly requests it.

import { supabase } from '@/lib/supabase'
import type {
  BookInsight,
  BookRecommendation,
  GeneratedInsights,
  RecommendationItem,
} from '@/types'

// ── Cache reads ───────────────────────────────────────────────────────────────

export async function getCachedInsight(bookId: string): Promise<BookInsight | null> {
  const { data } = await supabase
    .from('book_insights')
    .select('*')
    .eq('book_id', bookId)
    .maybeSingle()
  return (data as BookInsight | null)
}

export async function getCachedRecommendations(
  bookId: string,
): Promise<BookRecommendation[]> {
  const { data } = await supabase
    .from('book_recommendations')
    .select('*')
    .eq('source_book_id', bookId)
  return (data as unknown as BookRecommendation[]) ?? []
}

// ── Cache writes ──────────────────────────────────────────────────────────────

async function saveInsight(
  bookId: string,
  source: string,
  like_reason: string,
  dislike_reason: string,
): Promise<BookInsight> {
  // Upsert on (user_id, book_id) — user_id filled by DEFAULT auth.uid()
  const { data, error } = await supabase
    .from('book_insights')
    .upsert(
      { book_id: bookId, like_reason, dislike_reason, generated_from_source: source },
      { onConflict: 'user_id,book_id' },
    )
    .select()
    .single()
  if (error) throw error
  return data as BookInsight
}

async function saveRecommendations(
  bookId: string,
  similar: RecommendationItem[],
  blindSide: RecommendationItem,
): Promise<void> {
  // Delete stale recommendations, then insert fresh set
  await supabase
    .from('book_recommendations')
    .delete()
    .eq('source_book_id', bookId)

  await supabase.from('book_recommendations').insert([
    {
      source_book_id: bookId,
      recommendation_type: 'similar' as const,
      payload_json: similar as unknown as import('@/types/database').Json,
    },
    {
      source_book_id: bookId,
      recommendation_type: 'blind_side' as const,
      payload_json: [blindSide] as unknown as import('@/types/database').Json,
    },
  ])
}

// ── Generation ────────────────────────────────────────────────────────────────

interface BookContext {
  title: string
  subtitle?: string | null
  authors: string[]
  description?: string | null
  series_name?: string | null
  page_count?: number | null
}

interface CompletedBookContext {
  title: string
  authors: string[]
}

export interface GenerateOptions {
  book: BookContext
  completedBooks: CompletedBookContext[]
  source?: 'on_demand' | 'post_scan'
}

export async function generateAndCacheInsights(
  bookId: string,
  opts: GenerateOptions,
): Promise<{ insight: BookInsight; recommendations: BookRecommendation[] }> {
  const source = opts.source ?? 'on_demand'

  // Call the edge function — this is the only line that costs money
  const { data, error } = await supabase.functions.invoke<GeneratedInsights>(
    'generate-insights',
    {
      body: {
        book: opts.book,
        completedBooks: opts.completedBooks,
        source,
      },
    },
  )

  if (error || !data) {
    throw new Error(
      error?.message ?? 'Insight generation failed. Check your connection.',
    )
  }

  // Validate minimal shape
  if (!data.like_reason || !data.dislike_reason) {
    throw new Error('Received incomplete insights from AI. Try again.')
  }

  const similar = Array.isArray(data.similar) ? data.similar.slice(0, 5) : []
  const blindSide = data.blind_side

  const [insight] = await Promise.all([
    saveInsight(bookId, source, data.like_reason, data.dislike_reason),
    blindSide
      ? saveRecommendations(bookId, similar, blindSide)
      : Promise.resolve(),
  ])

  const recommendations = await getCachedRecommendations(bookId)
  return { insight, recommendations }
}
