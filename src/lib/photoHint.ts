import type { CategoryId } from './types'

export interface PhotoHint {
  dataUrl: string
  suggestions: { category: CategoryId; confidence: number }[]
}

/**
 * Colour-based photo hint. Runs fully on the device, no upload, no model.
 *
 * It only looks at colour and brightness, so it cannot know what an object is
 * made of. Confidence is deliberately capped at 60% and the UI always asks the
 * person to confirm or correct the category.
 */
export async function analysePhoto(source: File | string, maxSide = 640): Promise<PhotoHint> {
  const bitmap = await loadImage(source)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.6)

  // Analyse a small thumbnail for speed on low-end phones.
  const s = 48
  const small = document.createElement('canvas')
  small.width = s
  small.height = s
  const sctx = small.getContext('2d')
  if (!sctx) throw new Error('Canvas unavailable')
  sctx.drawImage(canvas, 0, 0, s, s)
  const px = sctx.getImageData(0, 0, s, s).data

  let green = 0
  let brown = 0
  let beige = 0
  let white = 0
  let vivid = 0
  let grey = 0
  let clear = 0
  let n = 0
  let lumSum = 0
  let lumSq = 0

  for (let i = 0; i < px.length; i += 4) {
    const [hue, sat, val] = rgbToHsv(px[i], px[i + 1], px[i + 2])
    n++
    lumSum += val
    lumSq += val * val
    if (sat > 0.25 && val > 0.18 && hue >= 65 && hue <= 165) green++
    if (sat > 0.3 && val > 0.12 && val < 0.6 && hue >= 10 && hue < 45) brown++
    if (sat >= 0.12 && sat <= 0.45 && val >= 0.55 && hue >= 25 && hue <= 55) beige++
    if (sat < 0.1 && val > 0.82) white++
    if (sat > 0.55 && val > 0.45) vivid++
    if (sat < 0.12 && val >= 0.3 && val <= 0.8) grey++
    if (sat < 0.2 && val > 0.65 && hue >= 160 && hue <= 220) clear++
  }

  const f = (x: number) => x / n
  const mean = lumSum / n
  const contrast = Math.sqrt(Math.max(0, lumSq / n - mean * mean))

  const raw: Record<CategoryId, number> = {
    organic: 1.4 * f(green) + 1.1 * f(brown),
    paper: 1.3 * f(beige) + 0.6 * f(white),
    plastic: 1.2 * f(vivid) + 0.5 * f(clear) + 0.2 * f(white),
    metal: 0.9 * f(grey) * (0.5 + contrast * 2),
    glass: 0.9 * f(clear) + 0.2 * f(green) * (contrast > 0.25 ? 1 : 0),
    ewaste: 0.25 * f(grey) * (mean < 0.35 ? 1.5 : 0.5),
    hazardous: 0,
    sanitary: 0.15 * f(white),
  }

  const entries = (Object.entries(raw) as [CategoryId, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1
  const suggestions = entries.slice(0, 3).map(([category, v]) => ({
    category,
    confidence: Math.min(0.6, (v / total) * 0.75),
  }))

  return { dataUrl, suggestions }
}

function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let url: string
    let shouldRevoke = false
    if (typeof source === 'string') {
      url = source
    } else {
      url = URL.createObjectURL(source)
      shouldRevoke = true
    }
    const img = new Image()
    img.onload = () => {
      if (shouldRevoke) URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      if (shouldRevoke) URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return [h, s, max]
}
