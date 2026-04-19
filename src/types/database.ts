export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          authors: string[]
          cover_url: string | null
          description: string | null
          page_count: number | null
          series_name: string | null
          series_number: number | null
          isbn_10: string | null
          isbn_13: string | null
          open_library_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          authors?: string[]
          cover_url?: string | null
          description?: string | null
          page_count?: number | null
          series_name?: string | null
          series_number?: number | null
          isbn_10?: string | null
          isbn_13?: string | null
          open_library_key?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          subtitle?: string | null
          authors?: string[]
          cover_url?: string | null
          description?: string | null
          page_count?: number | null
          series_name?: string | null
          series_number?: number | null
          isbn_10?: string | null
          isbn_13?: string | null
          open_library_key?: string | null
        }
        Relationships: []
      }
      user_books: {
        Row: {
          id: string
          user_id: string
          book_id: string
          current_page: number
          total_pages: number | null
          status: 'reading' | 'completed'
          date_added: string
          completed_at: string | null
          rating: number | null
          is_favorite: boolean
        }
        Insert: {
          id?: string
          // user_id has DEFAULT auth.uid() — omit to use the session user
          user_id?: string
          book_id: string
          current_page?: number
          total_pages?: number | null
          status?: 'reading' | 'completed'
          date_added?: string
          completed_at?: string | null
          rating?: number | null
          is_favorite?: boolean
        }
        Update: {
          current_page?: number
          total_pages?: number | null
          status?: 'reading' | 'completed'
          completed_at?: string | null
          rating?: number | null
          is_favorite?: boolean
        }
        Relationships: [
          { foreignKeyName: 'user_books_book_id_fkey'; columns: ['book_id']; referencedRelation: 'books'; referencedColumns: ['id'] }
        ]
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_want_to_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          // user_id has DEFAULT auth.uid() — omit to use the session user
          user_id?: string
          name: string
          description?: string | null
          is_want_to_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collection_books: {
        Row: {
          id: string
          collection_id: string
          book_id: string
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          book_id: string
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          book_id?: string
          added_at?: string
        }
        Relationships: [
          { foreignKeyName: 'collection_books_collection_id_fkey'; columns: ['collection_id']; referencedRelation: 'collections'; referencedColumns: ['id'] },
          { foreignKeyName: 'collection_books_book_id_fkey'; columns: ['book_id']; referencedRelation: 'books'; referencedColumns: ['id'] }
        ]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          user_book_id: string
          content: string
          page_number: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          // user_id has DEFAULT auth.uid() — omit to use the session user
          user_id?: string
          user_book_id: string
          content: string
          page_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          page_number?: number | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'notes_user_book_id_fkey'; columns: ['user_book_id']; referencedRelation: 'user_books'; referencedColumns: ['id'] }
        ]
      }
      book_insights: {
        Row: {
          id: string
          user_id: string
          book_id: string
          like_reason: string | null
          dislike_reason: string | null
          generated_from_source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          book_id: string
          like_reason?: string | null
          dislike_reason?: string | null
          generated_from_source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          like_reason?: string | null
          dislike_reason?: string | null
          generated_from_source?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_recommendations: {
        Row: {
          id: string
          user_id: string
          source_book_id: string | null
          recommendation_type: 'similar' | 'blind_side' | 'general'
          payload_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          source_book_id?: string | null
          recommendation_type: 'similar' | 'blind_side' | 'general'
          payload_json: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          payload_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          id: string
          user_id: string
          user_book_id: string
          page_at: number
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          user_book_id: string
          page_at: number
          recorded_at?: string
        }
        Update: {
          page_at?: number
          recorded_at?: string
        }
        Relationships: [
          { foreignKeyName: 'reading_sessions_user_book_id_fkey'; columns: ['user_book_id']; referencedRelation: 'user_books'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
