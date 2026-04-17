import { useState, useRef, useEffect } from 'react'
import { useNotes } from '@/hooks/useNotes'
import { useDebounce } from '@/hooks/useDebounce'
import type { Note } from '@/types'
import styles from './NoteList.module.css'

interface Props {
  userBookId: string
}

export function NoteList({ userBookId }: Props) {
  const { notes, loading, add, update, remove } = useNotes(userBookId)
  const [showForm, setShowForm] = useState(false)

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Notes</h3>
        {!showForm && (
          <button
            className={styles.addBtn}
            onClick={() => setShowForm(true)}
          >
            + Add note
          </button>
        )}
      </div>

      {showForm && (
        <NoteForm
          onSave={async (content, page) => {
            await add(content, page)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : notes.length === 0 && !showForm ? (
        <p className={styles.muted}>No notes yet.</p>
      ) : (
        <ul className={styles.list}>
          {notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              onUpdate={update}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

// ── NoteForm ──────────────────────────────────────────────────────────────────

interface FormProps {
  onSave: (content: string, page?: number) => Promise<void>
  onCancel: () => void
  initialContent?: string
  initialPage?: number | null
}

export function NoteForm({ onSave, onCancel, initialContent = '', initialPage = null }: FormProps) {
  const [content, setContent]   = useState(initialContent)
  const [page, setPage]         = useState<string>(initialPage != null ? String(initialPage) : '')
  const [saving, setSaving]     = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onSave(content.trim(), page ? Number(page) : undefined)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.form}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder="Write your note…"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
      />
      <div className={styles.formRow}>
        <input
          type="number"
          className={`form-input ${styles.pageInput}`}
          placeholder="Page (optional)"
          value={page}
          onChange={e => setPage(e.target.value)}
          min={1}
        />
        <div className={styles.formActions}>
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ width: 'auto' }}
            onClick={handleSave}
            disabled={!content.trim() || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── NoteItem ──────────────────────────────────────────────────────────────────

interface ItemProps {
  note: Note
  onUpdate: (id: string, content: string, page: number | null) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function NoteItem({ note, onUpdate, onDelete }: ItemProps) {
  const [editing, setEditing]   = useState(false)
  const [content, setContent]   = useState(note.content)
  const [page, setPage]         = useState<string>(note.page_number != null ? String(note.page_number) : '')
  const [deleting, setDeleting] = useState(false)

  const debouncedContent = useDebounce(content, 1000)
  const debouncedPage    = useDebounce(page, 1000)

  // Auto-save while editing
  useEffect(() => {
    if (!editing) return
    if (debouncedContent === note.content && (debouncedPage === '' ? null : Number(debouncedPage)) === note.page_number) return
    const pageNum = debouncedPage ? Number(debouncedPage) : null
    onUpdate(note.id, debouncedContent, pageNum)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, debouncedPage])

  async function handleDelete() {
    setDeleting(true)
    await onDelete(note.id)
  }

  return (
    <li className={styles.noteItem}>
      {note.page_number != null && !editing && (
        <span className={styles.pageTag}>p. {note.page_number}</span>
      )}

      {editing ? (
        <div className={styles.editArea}>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className={styles.formRow}>
            <input
              type="number"
              className={`form-input ${styles.pageInput}`}
              placeholder="Page"
              value={page}
              onChange={e => setPage(e.target.value)}
              min={1}
            />
            <button
              className="btn btn-outline"
              style={{ width: 'auto', fontSize: '0.8125rem' }}
              onClick={() => setEditing(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.noteContent} onClick={() => setEditing(true)}>
          {note.content}
        </p>
      )}

      <div className={styles.noteActions}>
        {!editing && (
          <button className={styles.editLink} onClick={() => setEditing(true)}>Edit</button>
        )}
        <button
          className={styles.deleteLink}
          onClick={handleDelete}
          disabled={deleting}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
