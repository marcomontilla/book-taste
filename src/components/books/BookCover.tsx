interface Props {
  url: string | null
  title: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { width: '3rem',   height: '4.25rem',  fontSize: '0.5rem'  },
  md: { width: '4.5rem', height: '6.25rem',  fontSize: '0.625rem' },
  lg: { width: '7.5rem', height: '10.5rem',  fontSize: '0.75rem' },
}

export function BookCover({ url, title, size = 'md' }: Props) {
  const dim = sizes[size]

  const placeholder = (
    <div style={{
      width: dim.width,
      height: dim.height,
      background: 'var(--color-primary-light)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.25rem',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: dim.fontSize,
        color: 'var(--color-primary)',
        textAlign: 'center',
        lineHeight: 1.3,
        wordBreak: 'break-word',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
      }}>
        {title}
      </span>
    </div>
  )

  if (!url) return placeholder

  return (
    <img
      src={url}
      alt={`Cover of ${title}`}
      style={{
        width: dim.width,
        height: dim.height,
        objectFit: 'cover',
        borderRadius: '0.25rem',
        border: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
      onError={e => {
        // swap to placeholder on broken image
        const target = e.currentTarget
        target.style.display = 'none'
        const parent = target.parentElement
        if (parent) {
          const ph = document.createElement('div')
          ph.style.cssText = `width:${dim.width};height:${dim.height};background:var(--color-primary-light);border:1px solid var(--color-border);border-radius:0.25rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;`
          ph.textContent = title.slice(0, 30)
          ph.style.fontSize = dim.fontSize
          ph.style.color = 'var(--color-primary)'
          ph.style.padding = '0.25rem'
          ph.style.textAlign = 'center'
          parent.insertBefore(ph, target)
        }
      }}
    />
  )
}
