import {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
} from 'react'
import styles from './ToastContext.module.css'

type ToastType = 'success' | 'error'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // useId gives a stable prefix; actual id is prefix + counter
  const prefix = useId()
  const [counter, setCounter] = useState(0)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${prefix}-${counter}`
    setCounter(c => c + 1)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  // counter intentionally excluded — we only want prefix stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[styles.toast, t.type === 'error' ? styles.error : styles.success].join(' ')}
          >
            {t.type === 'success' ? '✓' : '✕'} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
