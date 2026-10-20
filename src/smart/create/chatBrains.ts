/**
 * The Create chat. Not an open-ended assistant: each "brain" only fills the
 * fields of one Create flow, asks for whatever is missing, and hands back to
 * the normal step-by-step screens. Everything here is simulated keyword parsing.
 */
import type { Asset, MenuItem, MenuSection, SpotlightData } from '../../types'
import { SCREENS } from '../../data/seed'
import { BRAND_BG, MENU_PHOTO, SAMPLE_PHOTOS } from '../../data/images'
import { fmtRange, fmtTime, todayStamp, uid } from '../../lib/time'
import { SCREEN_WORDS, parseTime } from '../intent'
import { OFFER_RE, QR_LABEL_IDEAS, extractMenu, normalizeUrl, splitOffer, validUrl } from './helpers'

export interface ChatAction { id: string; label: string; primary?: boolean }
export interface BotReply { text: string; preview?: Asset; actions?: ChatAction[] }
export interface ChatMessage extends BotReply { id: string; from: 'user' | 'bot'; image?: string }
export type ChatInput =
  | { text: string }
  | { action: string }
  | { file: { src: string; name: string; pdf: boolean } }
export interface BrainContext { assets: Asset[] }
export interface BrainResult<S> {
  patch: Partial<S>
  reply?: BotReply
  /** step to move the flow to */
  done?: string
  delay?: number
  /** label under the typing dots, e.g. "Reading your menu…" */
  typing?: string
}
export interface Brain<S> {
  greet: (s: S) => BotReply
  respond: (input: ChatInput, s: S, ctx: BrainContext) => BrainResult<S>
}

// ---------- shared parsing ----------

const URL_RE = /(https?:\/\/[^\s,]+|www\.[^\s,]+|\b[a-z0-9-]+\.(?:com|net|org|co|io|bar|us|page|link|app)(?:\/[^\s,]*)?)/i
const RANGE_RE = /(\d{1,2})(?::(\d\d))?\s*(am|pm)?\s*(?:to|-|–|until|til)\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)/i
const UNTIL_RE = /\b(?:till|til|until|ends?(?: at)?)\s+(\d{1,2})(?::(\d\d))?\s*(am|pm)?\b/i
const WHEN_RE = /\b(all day(?:\s+\w+day)?|tonight only|today only|tonight|this weekend|every \w+day|weekdays|game days?)\b/i

const tidy = (s: string) =>
  s
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.;:!\-–—]+|[\s,.;:!\-–—]+$/g, '')
    .replace(/^(?:and|with|plus|for|on|at|to|the)\b\s*/i, '')
    .replace(/\s*\b(?:and|with|plus|for|on|at|to|the)$/i, '')
    .trim()

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const has = (o: object) => Object.keys(o).length > 0

function takeScreen(t: string): { id?: string; rest: string } {
  for (const [re, id] of SCREEN_WORDS) {
    const full = new RegExp(`(?:\\b(?:on|to|for|at|in)\\s+)?(?:the\\s+)?(?:${re.source})(?:\\s+(?:tv|screen))?`, 'i')
    if (full.test(t)) return { id, rest: t.replace(full, ' ') }
  }
  return { rest: t }
}

function takeUrl(t: string): { url?: string; rest: string } {
  const m = t.match(URL_RE)
  if (!m) return { rest: t }
  const url = m[0].replace(/[.,;:!)]+$/, '')
  return { url: normalizeUrl(url), rest: t.replace(m[0], ' ') }
}

function screenName(id?: string) {
  return SCREENS.find((s) => s.id === id)?.name
}

// ---------- Spotlight ----------

export interface SpotlightSlots {
  image: string
  headline: string
  offer: string
  subline: string
  layout: SpotlightData['layout']
  qrOn: boolean
  qrUrl: string
  screen?: string
}

export function spotlightAsset(s: SpotlightSlots): Asset {
  return {
    id: uid('preview'),
    name: s.headline,
    kind: 'spotlight',
    createdAt: todayStamp(),
    enabled: true,
    owner: 'Nick',
    spotlight: { image: s.image, headline: s.headline, offer: s.offer, subline: s.subline, layout: s.layout, qrUrl: s.qrOn ? s.qrUrl : undefined },
  }
}

const SPOTLIGHT_HELP = 'Tell me what to change. For example “make it 40% off”, “call it Guinness Tuesday”, “bottom band”, “add a QR to coppertap.com”, or send a different photo.'

function photoActions(hint: string): ChatAction[] {
  const beer = /\b(beer|stout|pint|guinness|draft|ipa|lager|happy hour)\b/i.test(hint)
  const taco = /\btacos?\b/i.test(hint)
  const samples = SAMPLE_PHOTOS.map((p) => ({ id: `sample:${p.id}`, label: `Use sample: ${p.label}`, primary: (p.id === 'stout' && beer) || (p.id === 'tacos' && taco) }))
  samples.sort((a, b) => Number(b.primary) - Number(a.primary))
  return [{ id: 'camera', label: 'Take a photo' }, { id: 'upload', label: 'Upload a photo' }, ...samples, { id: 'nophoto', label: 'No photo, use our colors' }]
}

export function parseSpotlight(text: string): Partial<SpotlightSlots> {
  const patch: Partial<SpotlightSlots> = {}
  let t = ` ${text} `

  if (/\b(?:no|remove|drop)(?: the)? qr\b/i.test(t)) {
    patch.qrOn = false
    t = t.replace(/\b(?:no|remove|drop)(?: the)? qr(?: code)?\b/i, ' ')
  }
  const url = takeUrl(t)
  if (url.url) {
    patch.qrUrl = url.url
    patch.qrOn = true
    t = url.rest.replace(/\b(?:and\s+)?(?:with\s+)?(?:add\s+)?(?:a\s+)?qr(?:\s+code)?(?:\s+(?:to|for|linking to|pointing to|that goes to))?/i, ' ')
  }

  const sc = takeScreen(t)
  if (sc.id) {
    patch.screen = sc.id
    t = sc.rest
  }

  const when: string[] = []
  const range = t.match(new RegExp(`(?:\\bfrom\\s+)?${RANGE_RE.source}`, 'i'))
  if (range) {
    when.push(fmtRange(parseTime(range[1], range[2], range[3] ?? range[6]), parseTime(range[4], range[5], range[6])))
    t = t.replace(range[0], ' ')
  } else {
    const until = t.match(UNTIL_RE)
    if (until) {
      when.push(`Until ${fmtTime(parseTime(until[1], until[2], until[3] ?? 'pm'), true)}`)
      t = t.replace(until[0], ' ')
    }
  }
  const phrase = t.match(WHEN_RE)
  if (phrase) {
    when.unshift(cap(phrase[1]))
    t = t.replace(phrase[0], ' ')
  }

  if (/\bbottom (?:band|banner|bar)\b|\bbanner\b/i.test(t)) patch.layout = 'band'
  else if (/\bfull(?:[-\s]screen)?\s*overlay\b|\bcent(?:er|re)d\b|\boverlay\b/i.test(t)) patch.layout = 'overlay'
  else if (/\bside panel\b/i.test(t)) patch.layout = 'panel'
  t = t.replace(/\b(?:use (?:a |the )?)?(?:bottom (?:band|banner|bar)|banner|full(?:[-\s]screen)?\s*overlay|overlay|cent(?:er|re)d|side panel)(?: layout)?\b/gi, ' ')

  if (/\bno (?:photo|picture|image|pic)\b|\bjust (?:text|colou?rs)\b/i.test(t)) {
    patch.image = BRAND_BG
    t = t.replace(/\b(?:with\s+)?(?:no (?:photo|picture|image|pic)|just (?:text|colou?rs))\b/i, ' ')
  } else if (/\b(?:photo|picture|pic|image)\b/i.test(t)) {
    if (/\b(?:stout|beer|pint)\b/i.test(t)) patch.image = SAMPLE_PHOTOS[0].src
    else if (/\btacos?\b/i.test(t)) patch.image = SAMPLE_PHOTOS[1].src
    t = t.replace(/\b(?:use|with|and)?\s*(?:the|a)?\s*(?:stout|beer|pint|tacos?)?\s*(?:sample\s+)?(?:photo|picture|pic|image)\b/i, ' ')
  }

  const sub = t.match(/\b(?:extra line|subline|small text|underneath)\s*(?:is|:|says)?\s+["“']?(.+?)["”']?\s*$/i)
  if (sub) {
    when.push(tidy(sub[1]))
    t = t.slice(0, sub.index)
  }
  if (when.length) patch.subline = when.join(' · ')

  const rename = t.match(/\b(?:call it|name it|headline(?:\s+is|:)?|title(?:\s+is|:)?|change (?:the )?headline to)\s+["“']?(.+?)["”']?\s*$/i)
  if (rename) {
    patch.headline = tidy(rename[1])
    t = t.slice(0, rename.index)
  }

  let rest = tidy(
    t.replace(/^\s*(?:please\s+)?(?:can you\s+)?(?:create|make|build|do|put up|put|show|i want|i need|we have|we've got|let'?s do)?\s*(?:me\s+)?(?:a|an)?\s*(?:spotlight|promo|promotion|slide)?\s*(?:for|of|about|:)?\s*/i, ' '),
  )
  if (rest) {
    const offer = rest.match(OFFER_RE)
    const bare = offer ? tidy(rest.replace(offer[0], ' ').replace(/\b(?:make it|change (?:it )?to|it|now|instead|actually|the offer(?: is)?|offer|price)\b/gi, ' ')) : rest
    if (offer && !bare) {
      patch.offer = offer[0].replace(/\s+/g, ' ')
      rest = ''
    } else if (!patch.headline) {
      const split = splitOffer(rest)
      patch.headline = split.headline
      if (split.offer) patch.offer = split.offer
    }
  }
  return patch
}

function spotlightStatus(s: SpotlightSlots, patch: Partial<SpotlightSlots>, said: string): BotReply {
  if (!s.headline) {
    return { text: patch.image ? 'Nice photo. What’s the offer? For example “Guinness 50% off”.' : 'What’s the offer? Try something like “Guinness 50% off” or “Taco Tuesday $3 tacos”.' }
  }
  const bits = [`“${s.headline}${s.offer ? ` · ${s.offer}` : ''}”`]
  if (s.subline) bits.push(s.subline.toLowerCase())
  if (s.qrOn && s.qrUrl) bits.push('with a QR code')
  if (s.screen) bits.push(`for the ${screenName(s.screen)}`)
  if (!s.image) return { text: `Got it: ${bits.join(', ')}. Now add a photo.`, actions: photoActions(`${said} ${s.headline}`) }
  return {
    text: `Here’s your Spotlight: ${bits.join(', ')}. You can still change anything on the next screen.${s.screen ? ` I’ll pick the ${screenName(s.screen)} for you when you publish.` : ''}`,
    preview: spotlightAsset(s),
    actions: [{ id: 'confirm', label: 'Looks good, show me', primary: true }, { id: 'change', label: 'Change something' }],
  }
}

export const spotlightBrain: Brain<SpotlightSlots> = {
  greet: (s) => {
    if (s.headline && !s.image) return { text: `Got “${s.headline}${s.offer ? ` ${s.offer}` : ''}”. Add a photo to finish, or tell me more.`, actions: photoActions(s.headline) }
    return { text: 'Tell me what you’re promoting and I’ll make the slide. Mention the offer, and the TV or time if you know them.' }
  },
  respond: (input, s) => {
    let patch: Partial<SpotlightSlots> = {}
    let said = ''
    if ('action' in input) {
      const a = input.action
      if (a === 'confirm') return { patch: {}, done: 'design' }
      if (a === 'change') return { patch: {}, reply: { text: SPOTLIGHT_HELP } }
      if (a === 'nophoto') patch = { image: BRAND_BG }
      if (a.startsWith('sample:')) patch = { image: SAMPLE_PHOTOS.find((p) => `sample:${p.id}` === a)?.src ?? '' }
    } else if ('file' in input) {
      patch = { image: input.file.src }
    } else {
      said = input.text
      patch = parseSpotlight(input.text)
      if (!has(patch) && s.headline) return { patch, reply: { text: `I didn’t catch a change there. ${SPOTLIGHT_HELP}` } }
    }
    return { patch, reply: spotlightStatus({ ...s, ...patch }, patch, said) }
  },
}

// ---------- QR ----------

export interface QrSlots { url: string; label: string; mode: 'full' | 'spotlight'; spotlightId?: string }

export function qrAsset(s: QrSlots): Asset {
  return { id: uid('preview'), name: s.label || 'QR code', kind: 'qr', createdAt: todayStamp(), enabled: true, owner: 'Nick', qr: { url: normalizeUrl(s.url), label: s.label, mode: s.mode, spotlightId: s.spotlightId } }
}

const LABEL_KEYWORDS: [RegExp, string][] = [
  [/\b(?:rewards?|loyalty|points)\b/i, QR_LABEL_IDEAS[1]],
  [/\b(?:reviews?|rate us|feedback)\b/i, QR_LABEL_IDEAS[2]],
  [/\border(?:ing)?\b/i, QR_LABEL_IDEAS[3]],
  [/\b(?:specials?|deals?)\b/i, QR_LABEL_IDEAS[0]],
  [/\bwi-?fi\b/i, 'Free Wi-Fi: scan to connect'],
  [/\bmenu\b/i, 'Scan for our full menu'],
  [/\b(?:sign ?up|newsletter|email list)\b/i, 'Sign up for news & deals'],
]

export function parseQr(text: string, ctx: BrainContext): Partial<QrSlots> {
  const patch: Partial<QrSlots> = {}
  const url = takeUrl(text)
  if (url.url) patch.url = url.url
  const t = url.rest
  const quoted = t.match(/["“]([^"”]+)["”]/)
  const says = t.match(/\b(?:that says|saying|says|label(?:led)?(?: it)?|text)\s*:?\s+(.+)$/i)
  if (quoted) patch.label = tidy(quoted[1])
  else if (says) patch.label = cap(tidy(says[1]))
  else {
    const kw = LABEL_KEYWORDS.find(([re]) => re.test(t))
    if (kw) patch.label = kw[1]
  }
  const spot = ctx.assets.filter((a) => a.kind === 'spotlight').find((a) => t.toLowerCase().includes(a.name.toLowerCase()))
  if (spot && /\b(?:spotlight|promo|on the|on our|add (?:it )?to|onto)\b/i.test(t)) {
    patch.mode = 'spotlight'
    patch.spotlightId = spot.id
  } else if (/\bfull[-\s]?screen\b|\bon its own\b|\bby itself\b/i.test(t)) {
    patch.mode = 'full'
  }
  return patch
}

function qrStatus(s: QrSlots, patch: Partial<QrSlots>, ctx: BrainContext): BotReply {
  const got = patch.label ? `Got the message “${s.label}”. ` : ''
  if (!s.url) return { text: `${got}Where should the code take people? Paste a link, like coppertap.com/rewards.` }
  if (!validUrl(s.url)) return { text: 'That doesn’t look like a web address yet. Try something like coppertap.com/rewards.' }
  const host = ctx.assets.find((a) => a.id === s.spotlightId)
  const actions: ChatAction[] = [{ id: 'confirm', label: 'Looks good, show me', primary: true }]
  if (!s.label) QR_LABEL_IDEAS.slice(0, 2).forEach((l, i) => actions.push({ id: `label:${i}`, label: `Say “${l}”` }))
  actions.push(s.mode === 'full' ? { id: 'mode:spotlight', label: 'Put it on a Spotlight instead' } : { id: 'mode:full', label: 'Make it full screen' })
  return {
    text: `${got}Here’s your QR code${s.mode === 'spotlight' && host ? ` on the ${host.name} Spotlight` : ''}. It’s real, so scan it with your phone to test.${s.label ? '' : ' Want it to say something?'}`,
    preview: qrAsset(s),
    actions,
  }
}

export const qrBrain: Brain<QrSlots> = {
  greet: () => ({ text: 'Paste the link you want guests to open, and tell me what the screen should say. For example “coppertap.com/rewards, join our rewards club”.' }),
  respond: (input, s, ctx) => {
    let patch: Partial<QrSlots> = {}
    if ('action' in input) {
      const a = input.action
      if (a === 'confirm') return { patch: {}, done: 'layout' }
      if (a === 'mode:full') patch = { mode: 'full' }
      if (a === 'mode:spotlight') patch = { mode: 'spotlight', spotlightId: s.spotlightId ?? ctx.assets.find((x) => x.kind === 'spotlight')?.id }
      if (a.startsWith('label:')) patch = { label: QR_LABEL_IDEAS[Number(a.split(':')[1])] }
    } else if ('text' in input) {
      patch = parseQr(input.text, ctx)
      if (!has(patch)) return { patch, reply: { text: 'I need a link to make the code, like coppertap.com/rewards. You can add what the screen should say too.' } }
    }
    return { patch, reply: qrStatus({ ...s, ...patch }, patch, ctx) }
  },
}

// ---------- Menu board ----------

export interface MenuSlots { title: string; columns: 1 | 2; sections: MenuSection[]; source: string; fileName: string }

export function menuAsset(s: MenuSlots): Asset {
  return { id: uid('preview'), name: s.title, kind: 'menu', createdAt: todayStamp(), enabled: true, owner: 'Nick', menu: { title: s.title, columns: s.columns, sections: s.sections } }
}

function parseItem(raw: string): MenuItem | null {
  const m = raw.match(/^\s*(.+?)\s*[-–:]?\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*$/)
  if (!m) return null
  return { id: uid('i'), name: cap(tidy(m[1])), price: `$${m[2]}` }
}

export function parseMenuItems(text: string): MenuSection[] {
  const sections: MenuSection[] = []
  for (const chunk of text.split(/;|\n/)) {
    const head = chunk.match(/^\s*([^:,]+):\s*(.+)$/)
    const title = head ? cap(tidy(head[1])) : 'Menu'
    const items = (head ? head[2] : chunk).split(/,|\band\b/i).map(parseItem).filter((x): x is MenuItem => !!x)
    if (items.length) sections.push({ id: uid('s'), title, items })
  }
  return sections
}

const MENU_ASK: ChatAction[] = [
  { id: 'upload', label: 'Upload a photo or PDF' },
  { id: 'camera', label: 'Take a photo' },
  { id: 'sample', label: 'Use the sample menu' },
]

function menuStatus(s: MenuSlots, intro: string): BotReply {
  if (!s.sections.length) return { text: `${intro}Send a photo or PDF of your menu, or type the items, like “Starters: wings 14, nachos 13; Drafts: Guinness 8”.`, actions: MENU_ASK }
  const items = s.sections.reduce((n, x) => n + x.items.length, 0)
  return {
    text: `${intro}Found ${plural(s.sections.length, 'section')} and ${plural(items, 'item')}. Check the prices, then you’re set.`,
    preview: menuAsset(s),
    actions: [
      { id: 'confirm', label: 'Looks good, show me', primary: true },
      { id: 'check', label: 'Check the items' },
      s.columns === 2 ? { id: 'cols:1', label: 'One column' } : { id: 'cols:2', label: 'Two columns' },
    ],
  }
}

const readSample = (): Partial<MenuSlots> => ({ source: MENU_PHOTO, fileName: 'copper-tap-menu.jpg', sections: extractMenu() })

export const menuBrain: Brain<MenuSlots> = {
  greet: () => ({ text: 'Send a photo or PDF of your menu and I’ll turn it into a menu for your TVs. You can also just type the items.', actions: MENU_ASK }),
  respond: (input, s) => {
    if ('file' in input) {
      const patch: Partial<MenuSlots> = { source: input.file.pdf ? 'pdf' : input.file.src, fileName: input.file.name, sections: extractMenu() }
      return { patch, reply: menuStatus({ ...s, ...patch }, ''), delay: 1800, typing: 'Reading your menu…' }
    }
    if ('action' in input) {
      const a = input.action
      if (a === 'confirm') return { patch: {}, done: 'design' }
      if (a === 'check') return { patch: {}, done: 'check' }
      if (a === 'sample') {
        const patch = readSample()
        return { patch, reply: menuStatus({ ...s, ...patch }, ''), delay: 1800, typing: 'Reading your menu…' }
      }
      if (a.startsWith('cols:')) {
        const patch: Partial<MenuSlots> = { columns: a === 'cols:1' ? 1 : 2 }
        return { patch, reply: menuStatus({ ...s, ...patch }, '') }
      }
      return { patch: {} }
    }
    const t = input.text
    if (/\b(?:sample|example|demo)\b/i.test(t)) {
      const patch = readSample()
      return { patch, reply: menuStatus({ ...s, ...patch }, ''), delay: 1800, typing: 'Reading your menu…' }
    }
    const patch: Partial<MenuSlots> = {}
    let rest = t
    const title = rest.match(/\b(?:call it|title(?:\s+is|:)?|name it|heading)\s+["“']?(.+?)["”']?\s*$/i)
    if (title) {
      patch.title = cap(tidy(title[1]))
      rest = rest.slice(0, title.index)
    }
    if (/\b(?:one|1|single)\s+col/i.test(rest)) patch.columns = 1
    else if (/\b(?:two|2)\s+col/i.test(rest)) patch.columns = 2
    rest = rest.replace(/\b(?:in\s+)?(?:one|1|single|two|2)\s+columns?\b/i, ' ')
    const found = parseMenuItems(rest)
    if (found.length) {
      if (/\badd\b/i.test(rest) && s.sections.length) {
        const merged = s.sections.map((x) => ({ ...x }))
        for (const f of found) {
          const same = merged.find((x) => x.title.toLowerCase() === f.title.toLowerCase()) ?? (f.title === 'Menu' ? merged[merged.length - 1] : undefined)
          if (same) same.items = [...same.items, ...f.items]
          else merged.push(f)
        }
        patch.sections = merged
      } else patch.sections = found
    }
    if (!has(patch)) return { patch, reply: { text: 'I couldn’t find menu items in that. Type them like “Wings 14, Nachos 13”, or send a photo of your menu.', actions: MENU_ASK } }
    const intro = patch.title && !found.length ? `Titled “${patch.title}”. ` : ''
    return { patch, reply: menuStatus({ ...s, ...patch }, intro) }
  },
}
