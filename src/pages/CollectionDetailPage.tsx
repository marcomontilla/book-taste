import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookCover } from '@/components/books/BookCover'
import { Modal } from '@/components/ui/Modal'
import {
  getCollectionWithBooks,
  renameCollection,
  removeBookFromCollection,
} from '@/services/collections'
import { useToast } from '@/contexts/ToastContext'
import type { CollectionWithBooks } from '@/types'
import styles from './CollectionDetailPage.module.css'
import pageStyles from './Page.module.css'

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [collection, setCollection] = useState<CollectionWithBooks | null>(null)
  const [loading, setLoading]       = useState(true)
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName]       = useState('')
  const [renaming, setRenaming]     = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getCollectionWithBooks(id)
      setCollection(data as CollectionWithBooks)
      setNewName(data.name)
    } catch {
      showToast('Could not load collection', 'error')
      navigate('/collections')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, showToast])

  useEffect(() => { load() }, [load])

  async function handleRename() {
    if (!collection || !newName.trim()) return
    setRenaming(true)
    try {
      await renameCollection(collection.id, newName.trim())
      setCollection(prev => prev ? { ...prev, name: newName.trim() } : prev)
      showToast('Renamed')
      setRenameOpen(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not rename', 'error')
    } finally {
      setRenaming(false)
    }
  }

  async function handleRemoveBook(collectionBookId: string, bookTitle: string) {
    try {
      await removeBookFromCollection(collectionBookId)
      showToast(`"${bookTitle}" removed`)
      setCollection(prev =>
        prev
          ? { ...prev, books: prev.books.filter(b => b.collectionBookId !== collectionBookId) }
          : prev,
      )
    } catch {
      showToast('Could not remove book', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!collection) return null

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.pageHeader}>
        <div>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/collections')}
          >
            ← Collections
          </button>
          <h1 className={pageStyles.pageTitle}>{collection.name}</h1>
        </div>
        <button
          className="btn btn-outline"
          style={{ width: 'auto' }}
          onClick={() => setRenameOpen(true)}
        >
          Rename
        </button>
      </div>

      {collection.books.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📖</span>
          <p className="empty-state-title">No books yet</p>
          <p className="empty-state-body">
            Add books from their detail page.
          </p>
        </div>
      ) : (
        <ul className={pageStyles.bookList} style={{ listStyle: 'none' }}>
          {collection.books.map(({ collectionBookId, book }) => (
            <li key={collectionBookId} className={styles.item}>
              <BookCover url={book.cover_url} title={book.title} size="md" />
              <div className={styles.info}>
                <p className={styles.title}>{book.title}</p>
                {book.authors.length > 0 && (
                  <p className={styles.author}>{book.authors.slice(0, 2).join(', ')}</p>
                )}
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveBook(collectionBookId, book.title)}
                title="Remove from collection"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename collection"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            className="form-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={handleRename}
            disabled={renaming || !newName.trim()}
          >
            {renaming ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
