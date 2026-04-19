import { useState } from 'react'
import styles from './StarRating.module.css'

interface Props {
  value: number | null
  onChange?: (rating: number | null) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const display = hovered ?? value ?? 0

  function handleClick(star: number) {
    if (readonly || !onChange) return
    onChange(value === star ? null : star)
  }

  return (
    <div
      className={[styles.stars, styles[size], readonly ? styles.readonly : ''].join(' ')}
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={[styles.star, star <= display ? styles.filled : ''].join(' ')}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          tabIndex={readonly ? -1 : 0}
        >
          ★
        </button>
      ))}
    </div>
  )
}
