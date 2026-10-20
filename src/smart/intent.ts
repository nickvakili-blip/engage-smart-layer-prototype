import { FOLLOWS, SCREENS } from '../data/seed'

/**
 * The plain-language box. Not a chat: it maps a sentence onto one of the six
 * buttons and pre-fills it, so the user lands on the same flow they'd tap into.
 */
export interface IntentResult {
  to: string
  summary: string
}

export const SCREEN_WORDS: [RegExp, string][] = [
  [/bar\s*tv\s*1|tv\s*1\b|main bar/i, 'bar1'],
  [/bar\s*tv\s*2|tv\s*2\b/i, 'bar2'],
  [/dining/i, 'dining'],
  [/patio|outside|outdoor/i, 'patio'],
  [/private|party room|event room/i, 'private'],
  [/host|entrance|front/i, 'host'],
]

export function parseTime(h: string, m: string | undefined, ap: string | undefined): number {
  let hh = parseInt(h, 10) % 12
  if (ap?.toLowerCase() === 'pm') hh += 12
  return hh * 60 + (m ? parseInt(m, 10) : 0)
}

export function parseIntent(text: string): IntentResult | null {
  const t = text.trim()
  if (!t) return null
  const screen = SCREEN_WORDS.find(([re]) => re.test(t))?.[1]
  const screenName = SCREENS.find((s) => s.id === screen)?.name
  const range = t.match(/(\d{1,2})(?::(\d\d))?\s*(am|pm)?\s*(?:to|-|–|until|til)\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)/i)
  const follow = FOLLOWS.find((f) => new RegExp(`\\b${f.label.replace('All ', '')}\\b`, 'i').test(t) || new RegExp(`\\b${f.id}\\b`, 'i').test(t))

  if (/fill|whole day|my day|black|empty|gaps?/i.test(t)) {
    return { to: '/smart/schedule/fill', summary: 'Fill my day' }
  }
  if (/menu/i.test(t)) {
    return { to: '/smart/create/menu', summary: 'Create a menu board' }
  }
  if (/\bqr\b|scan|https?:\/\/|www\./i.test(t)) {
    const url = t.match(/(https?:\/\/\S+|www\.\S+)/i)?.[1]
    return { to: `/smart/create/qr${url ? `?url=${encodeURIComponent(url.startsWith('http') ? url : `https://${url}`)}` : ''}`, summary: 'Create a QR code' }
  }
  if (follow || /\bgames?\b|match(es)?|sports/i.test(t)) {
    const p = new URLSearchParams()
    if (follow) p.set('follow', follow.id)
    if (screen) p.set('screen', screen)
    if (/weekend/i.test(t)) p.set('recurrence', 'weekends')
    else if (/night|prime/i.test(t)) p.set('recurrence', 'primetime')
    return { to: `/smart/schedule/games?${p}`, summary: `Games on a TV${follow ? ` · ${follow.label}` : ''}${screenName ? ` · ${screenName}` : ''}` }
  }
  const offer = /\d+\s*%\s*off|\$\s*\d|half[-\s]?price|bogo|happy hour|special|deal|off\b/i.test(t)
  if (range && screen) {
    const p = new URLSearchParams({ screen, start: String(parseTime(range[1], range[2], range[3] ?? range[6])), end: String(parseTime(range[4], range[5], range[6])) })
    return { to: `/smart/schedule/marketing?${p}`, summary: `Marketing on ${screenName}` }
  }
  if (offer || /spotlight|promo|photo|picture/i.test(t)) {
    const headline = t.replace(/\b(on|to)\s+(the\s+)?(bar\s*tv\s*\d|tv\s*\d|patio|dining( room)?|private room|host stand)\b.*/i, '').replace(/^(create|make|put|add)\s+(a\s+)?(spotlight|promo)\s*(for|of|:)?\s*/i, '').trim()
    const p = new URLSearchParams({ headline })
    if (screen) p.set('screen', screen)
    return { to: `/smart/create/spotlight?${p}`, summary: 'Create a Spotlight' }
  }
  return null
}

export const INTENT_EXAMPLES = [
  'Eagles games on Bar TV 1 every weekend',
  'Guinness 50% off',
  'Specials on the patio 11am to 5pm',
  'Fill my day',
]
