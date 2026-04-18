import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCollections } from '@/hooks/useCollections'
import { createCollection, deleteCollection } from '@/services/collections'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/contexts/ToastContext'
import styles from './CollectionsPage.module.css'
import pageStyles from './Page.module.css'

export function CollectionsPage() {
  const { collections, loading, error, refetch } = useCollections()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName]     = useState('')
  const [creating, setCreating]   = useState(false)

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      await createCollection(name)
      showToast(t('collections.title') + ' ' + t('common.create').toLowerCase() + 'd')
      setNewName('')
      setModalOpen(false)
      refetch()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not create collection', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? Books will not be deleted.`)) return
    try {
      await deleteCollection(id)
      showToast('Collection deleted')
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
          onClick={() => setModalOpen(true)}
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
                  <span className={styles.collectionIcon}>🗂</span>
                  <div>
                    <p className={styles.collectionName}>{c.name}</p>
                    <p className={styles.collectionCount}>
                      {t('collections.bookCount', { count: c.bookCount })}
                    </p>
                  </div>
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(c.id, c.name)}
                  title={t('common.delete')}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setNewName('') }}
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
    </div>
  )
}
