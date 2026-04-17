import { useEffect, useRef, useState } from 'react'
import { startScan, stopScan, type ScanResult } from '@/services/scanner'
import styles from './ScannerView.module.css'

interface Props {
  onDetect: (result: ScanResult) => void
  active: boolean
}

export function ScannerView({ onDetect, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!active || !videoRef.current) return

    setCameraError(null)
    setReady(false)

    startScan(
      videoRef.current,
      (result) => {
        onDetect(result)
      },
      (err) => {
        setCameraError(err.message)
      },
    ).then(() => setReady(true))

    return () => { stopScan() }
  }, [active, onDetect])

  if (cameraError) {
    return (
      <div className={styles.errorBox}>
        <p className={styles.errorText}>{cameraError}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        muted
        autoPlay
      />
      {/* Viewfinder overlay */}
      <div className={styles.overlay}>
        <div className={styles.dimTop} />
        <div className={styles.row}>
          <div className={styles.dimSide} />
          <div className={styles.viewfinder}>
            <span className={[styles.corner, styles.tl].join(' ')} />
            <span className={[styles.corner, styles.tr].join(' ')} />
            <span className={[styles.corner, styles.bl].join(' ')} />
            <span className={[styles.corner, styles.br].join(' ')} />
            {ready && <div className={styles.scanLine} />}
          </div>
          <div className={styles.dimSide} />
        </div>
        <div className={styles.dimBottom} />
      </div>
    </div>
  )
}
