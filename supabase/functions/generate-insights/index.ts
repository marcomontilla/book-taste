// Supabase Edge Function — runs on Deno
// Deploy: supabase functions deploy generate-insights
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Called on-demand only (never in background).
// Returns raw JSON; the frontend writes it to the cache tables.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookInput {
  title: string
  subtitle?: string | null
  authors: string[]
  description?: string | null
  series_name?: string | null
  page_count?: number | null
}

interface CompletedBook {
  title: string
  authors: string[]
}

interface RequestBody {
  book: BookInput
  completedBooks: CompletedBook[]
  source?: string
  language?: string
}

interface RecommendationItem {
  title: string
  author: string
  reason: string
}

interface InsightsResponse {
  like_reason: string
  dislike_reason: string
  similar: RecommendationItem[]
  blind_side: RecommendationItem
}

function buildPrompt(book: BookInput, completedBooks: CompletedBook[], language: string): string {
  const langInstruction = language === 'es'
    ? 'Respond entirely in Spanish (Español). All text in the JSON values must be in Spanish.'
    : 'Respond entirely in English.'
  const history = completedBooks.length > 0
    ? completedBooks
        .slice(0, 12)
        .map(b => `"${b.title}" by ${b.authors.join(', ') || 'Unknown'}`)
        .join('\n')
    : 'No reading history available yet.'

  return `You are a thoughtful book advisor. Analyse this book and the reader's history to produce personalised insights. ${langInstruction}

CURRENT BOOK:
Title: ${book.title}${book.subtitle ? `\nSubtitle: ${book.subtitle}` : ''}
Authors: ${book.authors.join(', ') || 'Unknown'}${book.series_name ? `\nSeries: ${book.series_name}` : ''}${book.page_count ? `\nPages: ${book.page_count}` : ''}${book.description ? `\nDescription: ${book.description.slice(0, 450)}` : ''}

READER'S COMPLETED BOOKS:
${history}

Reply with ONLY a valid JSON object — no markdown, no commentary:
{
  "like_reason": "2-3 sentences on why this specific reader would enjoy this book based on their history. Be specific and personal.",
  "dislike_reason": "1-2 sentences on what might not work for them, written as honest guidance not criticism.",
  "similar": [
    { "title": "Book Title", "author": "Author Name", "reason": "One sentence on the connection." },
    { "title": "Book Title", "author": "Author Name", "reason": "One sentence on the connection." },
    { "title": "Book Title", "author": "Author Name", "reason": "One sentence on the connection." }
  ],
  "blind_side": { "title": "Book Title", "author": "Author Name", "reason": "One sentence on why this different genre pick might still resonate." }
}

Rules: similar must have exactly 3 well-known books. blind_side must be from a clearly different genre. All text concise and mobile-friendly.`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
      )
    }

    const body: RequestBody = await req.json()
    const { book, completedBooks = [], language = 'en' } = body

    if (!book?.title) {
      return new Response(
        JSON.stringify({ error: 'book.title is required' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      )
    }

    const prompt = buildPrompt(book, completedBooks, language)

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      throw new Error(`Claude API ${claudeRes.status}: ${errText}`)
    }

    const claude = await claudeRes.json()
    const text: string = claude.content[0]?.text ?? ''

    // Extract the JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude did not return valid JSON')

    const insights: InsightsResponse = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(insights), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
