import type { MenuSection } from '../../types'
import { SAMPLE_MENU } from '../../data/seed'
import { uid } from '../../lib/time'

export const OFFER_RE = /(\d+\s*%\s*off|\$\s*\d+(?:\.\d{2})?(?:\s*(?:off|each|pints?|drafts?|wings|tacos))?|half[-\s]?price|bogo|buy one,? get one(?: free)?|2\s*for\s*\$?\d+|free\s+\w+)/i

/** "Guinness 50% off" → headline "Guinness", offer "50% off" */
export function splitOffer(text: string): { headline: string; offer: string } {
  const m = text.match(OFFER_RE)
  if (!m) return { headline: text.trim(), offer: '' }
  const headline = text.replace(m[0], '').replace(/\s{2,}/g, ' ').replace(/^[\s,:\-–—]+|[\s,:\-–—]+$/g, '')
  return { headline: headline || m[0], offer: headline ? m[0].replace(/\s+/g, ' ') : '' }
}

export function normalizeUrl(url: string): string {
  const u = url.trim()
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

export function validUrl(url: string): boolean {
  try {
    const u = new URL(normalizeUrl(url))
    return u.hostname.includes('.')
  } catch {
    return false
  }
}

export const QR_LABEL_IDEAS = ["Scan for today's specials", 'Join our rewards club', 'Leave us a review', 'Order from your table']

/** Simulated read of the menu. In production this calls the extraction service. */
export function extractMenu(): MenuSection[] {
  return SAMPLE_MENU.map((s) => ({ ...s, id: uid('s'), items: s.items.map((i) => ({ ...i, id: uid('i') })) }))
}
