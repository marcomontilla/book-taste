import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useCollections } from '@/hooks/useCollections'
import { createCollection, deleteCollection, renameCollection } from '@/services/collections'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/contexts/ToastContext'
import styles from './CollectionsPage.module.css'
import pageStyles from './Page.module.css'

export function CollectionsPage() {
  const { collections, loading, error, refetch } = useCollections()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName]       = useState('')
  const [creating, setCreating]     = useState(false)

  // Rename
  const [renameId, setRenameId]     = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming]     = useState(false)

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      await createCollection(name)
      showToast(t('collections.created'))
      setNewName('')
      setCreateOpen(false)
      refetch()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not create collection', 'error')
    } finally {
      setCreating(false)
    }
  }

  function openRename(id: string, currentName: string, e: React.MouseEvent) {
    e.stopPropagation()
    setRenameId(id)
    setRenameName(currentName)
  }

  async function handleRename() {
    if (!renameId || !renameName.trim()) return
    setRenaming(true)
    try {
      await renameCollection(renameId, renameName.trim())
      showToast(t('collections.renamed'))
      setRenameId(null)
      refetch()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not rename', 'error')
    } finally {
      setRenaming(false)
    }
  }

  async function handleDelete(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`${t('collections.confirmDelete', { name })}`)) return
    try {
      await deleteCollection(id)
      showToast(t('collections.deleted'))
      refetch()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete', 'error')
    }
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.pageHeader}>
        <h1 className={pageStyles.pageTitle}>{t('collections.title')}</h1>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={() => setCreateOpen(true)}
        >
          {t('collections.newBtn')}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : collections.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🗂</span>
          <p className="empty-state-title">{t('collections.empty.title')}</p>
          <p className="empty-state-body">{t('collections.empty.body')}</p>
        </div>
      ) : (
        <ul className={pageStyles.collectionGrid} style={{ listStyle: 'none' }}>
          {collections.map(c => (
            <li key={c.id}>
              <div className={styles.collectionCard}>
                <button
                  className={styles.cardContent}
                  onClick={() => navigate(`/collections/${c.id}`)}
                >
                  <div className={styles.cardMeta}>
                    <p className={styles.collectionName}>{c.name}</p>
                    <p className={styles.collectionCount}>
                      {t('collections.bookCount', { count: c.bookCount })}
                    </p>
                  </div>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={e => openRename(c.id, c.name, e)}
                  title={t('common.rename')}
                  aria-label={t('common.rename')}
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
                <button
                  className={[styles.actionBtn, styles.deleteBtn].join(' ')}
                  onClick={e => handleDelete(c.id, c.name, e)}
                  title={t('common.delete')}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setNewName('') }}
        title={t('collections.newModal')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label className="form-label" htmlFor="coll-name">{t('collections.nameLabel')}</label>
            <input
              id="coll-name"
              type="text"
              className="form-input"
              placeholder={t('collections.namePlaceholder')}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              autoFocus
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
          >
            {creating ? t('common.creating') : t('common.create')}
          </button>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal
        isOpen={renameId !== null}
        onClose={() => setRenameId(null)}
        title={t('collections.rename')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            className="form-input"
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={handleRename}
            disabled={renaming || !renameName.trim()}
          >
            {renaming ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
