// Scanner service — abstracts barcode detection behind a stable interface.
//
// Web implementation uses @zxing/browser (camera + ZXing decoder).
// To add Capacitor native scanning later, implement the same interface
// using @capacitor-community/barcode-scanner and swap it in here.

import { BrowserMultiFormatReader } from '@zxing/browser'

export interface ScanResult {
  raw: string
  isbn10: string | null
  isbn13: string | null
}

// Normalise any raw barcode string into ISBN-10 / ISBN-13.
export function normalizeIsbn(raw: string): ScanResult {
  const cleaned = raw.replace(/[-\s]/g, '')
  return {
    raw,
    isbn10: /^[\dX]{10}$/.test(cleaned) ? cleaned : null,
    isbn13: /^\d{13}$/.test(cleaned) ? cleaned : null,
  }
}

// True when the raw string looks like an ISBN (10 or 13 digits).
export function isIsbn(raw: string): boolean {
  const c = raw.replace(/[-\s]/g, '')
  return /^[\dX]{10}$/.test(c) || /^\d{13}$/.test(c)
}

// ── Web scanner implementation ────────────────────────────────────────────────

let _reader: BrowserMultiFormatReader | null = null
// ZXing v0.20+ returns a controls object from decodeFromVideoDevice
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _controls: any = null

export async function listCameras(): Promise<MediaDeviceInfo[]> {
  return BrowserMultiFormatReader.listVideoInputDevices()
}

// Starts continuous decoding from the device camera into `videoEl`.
// Calls `onDetect` once a valid ISBN barcode is read.
// Calls `onError` on camera permission denial or decode failures.
export async function startScan(
  videoEl: HTMLVideoElement,
  onDetect: (result: ScanResult) => void,
  onError: (err: Error) => void,
): Promise<void> {
  await stopScan()

  _reader = new BrowserMultiFormatReader()

  let devices: MediaDeviceInfo[]
  try {
    devices = await BrowserMultiFormatReader.listVideoInputDevices()
  } catch {
    onError(new Error('Camera access denied. Grant permission and try again.'))
    return
  }

  if (devices.length === 0) {
    onError(new Error('No camera found on this device.'))
    return
  }

  // Prefer the rear/environment camera on mobile
  const rearCamera = devices.find(d =>
    /back|rear|environment/i.test(d.label),
  )
  const deviceId = rearCamera?.deviceId ?? devices[0].deviceId

  try {
    _controls = await _reader.decodeFromVideoDevice(
      deviceId,
      videoEl,
      (result, _err) => {
        if (result) {
          const raw = result.getText()
          if (isIsbn(raw)) {
            onDetect(normalizeIsbn(raw))
          }
          // Non-ISBN barcodes silently ignored — keep scanning
        }
        // All callback errors are decode-loop errors (NotFoundException etc) — ignore.
        // Camera setup errors are caught by the outer try/catch below.
      },
    )
  } catch (err) {
    onError(err instanceof Error ? err : new Error('Could not start camera'))
  }
}

export async function stopScan(): Promise<void> {
  try {
    _controls?.stop()
  } catch {
    // ignore
  }
  _controls = null
  _reader = null
}
