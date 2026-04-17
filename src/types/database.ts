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
        }
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
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          current_page?: number
          total_pages?: number | null
          status?: 'reading' | 'completed'
          date_added?: string
          completed_at?: string | null
        }
        Update: {
          current_page?: number
          total_pages?: number | null
          status?: 'reading' | 'completed'
          completed_at?: string | null
        }
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
          user_id: string
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
        Update: never
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
          user_id: string
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
      }
    }
  }
}
