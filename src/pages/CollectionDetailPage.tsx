import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookCover } from '@/components/books/BookCover'
import { Modal } from '@/components/ui/Modal'
import {
  getCollectionWithBooks,
  renameCollection,
  removeBookFromCollection,
  addBookToCollection,
} from '@/services/collections'
import { getLibrary } from '@/services/userBooks'
import { useToast } from '@/contexts/ToastContext'
import type { CollectionWithBooks, UserBookWithBook } from '@/types'
import styles from './CollectionDetailPage.module.css'
import pageStyles from './Page.module.css'

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useTranslation()

  const [collection, setCollection] = useState<CollectionWithBooks | null>(null)
  const [loading, setLoading]       = useState(true)
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName]       = useState('')
  const [renaming, setRenaming]     = useState(false)

  // Add-books modal
  const [addOpen, setAddOpen]           = useState(false)
  const [libraryBooks, setLibraryBooks] = useState<UserBookWithBook[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [addSearch, setAddSearch]       = useState('')
  const [adding, setAdding]             = useState<Record<string, boolean>>({})

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
      showToast(t('collections.renamed'))
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
      showToast(`"${bookTitle}" ${t('common.remove').toLowerCase()}d`)
      setCollection(prev =>
        prev
          ? { ...prev, books: prev.books.filter(b => b.collectionBookId !== collectionBookId) }
          : prev,
      )
    } catch {
      showToast('Could not remove book', 'error')
    }
  }

  async function openAddModal() {
    setAddOpen(true)
    if (libraryBooks.length > 0) return
    setLibraryLoading(true)
    try {
      const books = await getLibrary()
      setLibraryBooks(books)
    } catch {
      showToast('Could not load library', 'error')
    } finally {
      setLibraryLoading(false)
    }
  }

  async function handleAddBook(bookId: string) {
    if (!collection || adding[bookId]) return
    setAdding(prev => ({ ...prev, [bookId]: true }))
    try {
      await addBookToCollection(collection.id, bookId)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not add book', 'error')
    } finally {
      setAdding(prev => ({ ...prev, [bookId]: false }))
    }
  }

  const inCollectionIds = new Set(collection?.books.map(b => b.book.id) ?? [])

  const filteredLibrary = libraryBooks.filter(ub => {
    const q = addSearch.toLowerCase()
    return (
      ub.book.title.toLowerCase().includes(q) ||
      ub.book.authors.some(a => a.toLowerCase().includes(q))
    )
  })

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
          <button className={styles.backBtn} onClick={() => navigate('/collections')}>
            {t('collections.backLink')}
          </button>
          <h1 className={pageStyles.pageTitle}>{collection.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={openAddModal}>
            {t('collections.addBooks')}
          </button>
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setRenameOpen(true)}>
            {t('common.rename')}
          </button>
        </div>
      </div>

      {collection.books.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📖</span>
          <p className="empty-state-title">{t('collections.detailEmpty.title')}</p>
          <p className="empty-state-body">{t('collections.detailEmpty.body')}</p>
          <button className="btn btn-primary" style={{ width: 'auto', marginTop: '0.5rem' }} onClick={openAddModal}>
            {t('collections.addBooks')}
          </button>
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
                title={t('common.remove')}
                aria-label={t('common.remove')}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Rename modal */}
      <Modal isOpen={renameOpen} onClose={() => setRenameOpen(false)} title={t('collections.rename')}>
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
            {renaming ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </Modal>

      {/* Add books modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setAddSearch('') }} title={t('collections.addBooksTitle')}>
        <div className={styles.addModal}>
          <input
            type="search"
            className="form-input"
            placeholder={t('collections.searchLibrary')}
            value={addSearch}
            onChange={e => setAddSearch(e.target.value)}
            autoFocus
          />
          {libraryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
              <div className="spinner" />
            </div>
          ) : filteredLibrary.length === 0 ? (
            <p className={styles.addEmpty}>
              {addSearch ? t('collections.noSearchResults') : t('collections.libraryEmpty')}
            </p>
          ) : (
            <ul className={styles.addList}>
              {filteredLibrary.map(ub => {
                const already = inCollectionIds.has(ub.book.id)
                return (
                  <li key={ub.id} className={styles.addItem}>
                    <BookCover url={ub.book.cover_url} title={ub.book.title} size="sm" />
                    <div className={styles.addInfo}>
                      <p className={styles.addTitle}>{ub.book.title}</p>
                      {ub.book.authors[0] && (
                        <p className={styles.addAuthor}>{ub.book.authors[0]}</p>
                      )}
                    </div>
                    <button
                      className={[
                        styles.addBtn,
                        already ? styles.addBtnDone : '',
                      ].join(' ')}
                      onClick={() => !already && handleAddBook(ub.book.id)}
                      disabled={already || adding[ub.book.id]}
                    >
                      {adding[ub.book.id]
                        ? '…'
                        : already
                          ? t('collections.alreadyAdded')
                          : `+ ${t('common.add')}`}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  )
}
