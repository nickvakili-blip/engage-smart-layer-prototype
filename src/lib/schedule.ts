import type { Block, BlockKind, Game, GamesRule, MarketingRule, Rule } from '../types'
import { CLOSE, OPEN, fmtRange, isWeekend, uid } from './time'
import { FOLLOWS, GAMES, GAME_SCREEN_PREFERENCE, PLAYLIST_NAMES, SCREENS, gameTitle } from '../data/seed'

export type Interval = [number, number]

/** Higher wins. Mirrors the PRD fill priority. */
export const PRIORITY: Record<BlockKind, number> = {
  game: 4,
  menu: 3,
  marketing: 3,
  autogame: 2,
  playlist: 1,
}

export const KIND_META: Record<BlockKind, { label: string; legend: string; bg: string; border: string; text: string; dot: string }> = {
  game: { label: 'Live game', legend: '1 · Scheduled live game', bg: 'bg-grape/15', border: 'border-grape', text: 'text-grape', dot: 'bg-grape' },
  marketing: { label: 'Marketing', legend: '2 · Marketing playlist', bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-800', dot: 'bg-amber-500' },
  autogame: { label: 'Live game (auto)', legend: '3 · Auto-filled live game', bg: 'bg-sky/15', border: 'border-sky', text: 'text-sky', dot: 'bg-sky' },
  playlist: { label: 'Playlist', legend: '4 · Default playlist', bg: 'bg-teal/10', border: 'border-teal', text: 'text-teal', dot: 'bg-teal' },
  menu: { label: 'Menu board', legend: 'Menu board', bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-800', dot: 'bg-emerald-600' },
}

const MIN_GAP = 15

export function screenBlocks(blocks: Block[], screenId: string): Block[] {
  return blocks.filter((b) => b.screenId === screenId).sort((a, b) => a.start - b.start)
}

export function subtract(intervals: Interval[], [s, e]: Interval): Interval[] {
  const out: Interval[] = []
  for (const [a, b] of intervals) {
    if (e <= a || s >= b) {
      out.push([a, b])
      continue
    }
    if (s > a) out.push([a, s])
    if (e < b) out.push([e, b])
  }
  return out.filter(([a, b]) => b - a >= MIN_GAP)
}

export function gapsFor(blocks: Block[], screenId: string): Interval[] {
  let gaps: Interval[] = [[OPEN, CLOSE]]
  for (const b of screenBlocks(blocks, screenId)) gaps = subtract(gaps, [b.start, b.end])
  return gaps
}

export function totalGapMinutes(blocks: Block[]): { screens: number; minutes: number } {
  let screens = 0
  let minutes = 0
  for (const s of SCREENS) {
    const g = gapsFor(blocks, s.id)
    if (g.length) screens++
    minutes += g.reduce((t, [a, b]) => t + b - a, 0)
  }
  return { screens, minutes }
}

export function blockAt(blocks: Block[], screenId: string, t: number): Block | undefined {
  return screenBlocks(blocks, screenId).find((b) => b.start <= t && b.end > t)
}

export function nextBlock(blocks: Block[], screenId: string, t: number): Block | undefined {
  return screenBlocks(blocks, screenId).find((b) => b.start > t)
}

export function todaysGames(): Game[] {
  return GAMES.filter((g) => g.day === 0)
}

export function unplacedGames(blocks: Block[]): Game[] {
  const placed = new Set(blocks.map((b) => b.gameId).filter(Boolean))
  return todaysGames().filter((g) => !placed.has(g.id))
}

export function matchesRule(game: Game, rule: Pick<GamesRule, 'follow' | 'recurrence'>): boolean {
  const follow = FOLLOWS.find((f) => f.id === rule.follow)
  if (!follow || !game.tags.includes(follow.tag)) return false
  if (rule.recurrence === 'weekends') return isWeekend(game.day)
  if (rule.recurrence === 'primetime') return game.start >= 18 * 60
  return true
}

export function gameBlock(game: Game, screenId: string, kind: 'game' | 'autogame', ruleId?: string): Block {
  return {
    id: uid('b'),
    screenId,
    start: game.start,
    end: game.end,
    kind,
    title: gameTitle(game),
    subtitle: `${game.league} · ${game.network}`,
    gameId: game.id,
    ruleId,
    source: 'smart',
  }
}

export interface PlaceResult {
  blocks: Block[]
  placed: boolean
  conflict?: Block
  trimmed: Block[]
}

/**
 * Place a block following Manager rules: lower-priority content on the same TV is
 * trimmed around it; equal/higher priority content wins and the new block is refused.
 */
export function placeBlock(blocks: Block[], nb: Block): PlaceResult {
  const overlapping = blocks.filter((b) => b.screenId === nb.screenId && b.start < nb.end && b.end > nb.start)
  // same kind of content simply replaces (newest wins), except live games which never cut each other off
  const conflict = overlapping.find((b) => PRIORITY[b.kind] >= PRIORITY[nb.kind] && !(b.kind === nb.kind && nb.kind !== 'game'))
  if (conflict) return { blocks, placed: false, conflict, trimmed: [] }
  const out: Block[] = []
  for (const b of blocks) {
    if (!overlapping.includes(b)) {
      out.push(b)
      continue
    }
    if (b.start < nb.start && nb.start - b.start >= MIN_GAP) out.push({ ...b, end: nb.start })
    if (b.end > nb.end && b.end - nb.end >= MIN_GAP) out.push({ ...b, id: uid('b'), start: nb.end })
  }
  out.push(nb)
  return { blocks: out, placed: true, trimmed: overlapping }
}

export function applyGamesRule(blocks: Block[], rule: GamesRule): { blocks: Block[]; placed: Game[]; conflicts: { game: Game; with: Block }[] } {
  let cur = blocks
  const placed: Game[] = []
  const conflicts: { game: Game; with: Block }[] = []
  for (const g of todaysGames().filter((g) => matchesRule(g, rule))) {
    if (cur.some((b) => b.gameId === g.id && b.screenId === rule.screenId)) continue
    // a game already showing elsewhere moves to the rule's TV
    const without = cur.filter((b) => !(b.gameId === g.id && b.kind === 'autogame'))
    const res = placeBlock(without, gameBlock(g, rule.screenId, 'game', rule.id))
    if (res.placed) {
      cur = res.blocks
      placed.push(g)
    } else if (res.conflict) conflicts.push({ game: g, with: res.conflict })
  }
  return { blocks: cur, placed, conflicts }
}

export function marketingAppliesToday(rule: MarketingRule): boolean {
  return rule.repeat !== 'weekdays' || !isWeekend(0)
}

export function marketingBlock(rule: Pick<MarketingRule, 'screenId' | 'start' | 'end' | 'assetIds'> & { id?: string }, title: string): Block {
  return {
    id: uid('b'),
    screenId: rule.screenId,
    start: rule.start,
    end: rule.end,
    kind: 'marketing',
    title,
    subtitle: `${rule.assetIds.length} promo${rule.assetIds.length === 1 ? '' : 's'} · Marketing playlist`,
    assetIds: rule.assetIds,
    ruleId: rule.id,
    source: 'smart',
  }
}

/**
 * "Fill my day": find every gap on every TV and fill it.
 * Priority: scheduled live game → scheduled marketing → auto-filled live game → default playlist.
 */
export function proposeFill(blocks: Block[], rules: Rule[], rotation: string[]): Block[] {
  const gaps: Record<string, Interval[]> = {}
  for (const s of SCREENS) gaps[s.id] = gapsFor(blocks, s.id)
  const proposed: Block[] = []
  const usedGames = new Set(blocks.map((b) => b.gameId).filter(Boolean) as string[])

  const fits = (screenId: string, s: number, e: number) => gaps[screenId].some(([a, b]) => a <= s && b >= e)
  const take = (b: Block) => {
    gaps[b.screenId] = subtract(gaps[b.screenId], [b.start, b.end])
    proposed.push(b)
  }

  // 1 · games that a saved rule asked for
  for (const r of rules.filter((r): r is GamesRule => r.kind === 'games')) {
    for (const g of todaysGames().filter((g) => matchesRule(g, r) && !usedGames.has(g.id))) {
      if (fits(r.screenId, g.start, g.end)) {
        take(gameBlock(g, r.screenId, 'game', r.id))
        usedGames.add(g.id)
      }
    }
  }
  // 2 · marketing windows that a saved rule asked for
  for (const r of rules.filter((r): r is MarketingRule => r.kind === 'marketing' && marketingAppliesToday(r))) {
    for (const [a, b] of [...gaps[r.screenId]]) {
      const s = Math.max(a, r.start)
      const e = Math.min(b, r.end)
      if (e - s >= MIN_GAP) take(marketingBlock({ ...r, start: s, end: e }, 'Marketing playlist'))
    }
  }
  // 3 · today's live games nobody has put on a TV yet
  for (const g of todaysGames().filter((g) => !usedGames.has(g.id)).sort((a, b) => a.start - b.start)) {
    const screen = GAME_SCREEN_PREFERENCE.find((sid) => fits(sid, g.start, g.end))
    if (screen) {
      take(gameBlock(g, screen, 'autogame'))
      usedGames.add(g.id)
      continue
    }
    // No free TV: a live game outranks a default playlist, so offer to replace one
    const swap = GAME_SCREEN_PREFERENCE.find((sid) => {
      const clash = (b: Block) => b.screenId === sid && b.start < g.end && b.end > g.start
      return blocks.filter(clash).every((b) => b.kind === 'playlist') && !proposed.some(clash)
    })
    if (swap) {
      const replaced = blocks.find((b) => b.screenId === swap && b.start < g.end && b.end > g.start)
      take({ ...gameBlock(g, swap, 'autogame'), note: replaced ? `Replaces ${replaced.title} ${fmtRange(Math.max(replaced.start, g.start), Math.min(replaced.end, g.end))}` : undefined })
      usedGames.add(g.id)
    }
  }
  // 4 · default content for whatever is left
  for (const s of SCREENS) {
    for (const [a, b] of gaps[s.id]) {
      if (s.kind === 'menu') {
        take({ id: uid('b'), screenId: s.id, start: a, end: b, kind: 'menu', title: 'House Menu', subtitle: 'Menu board', assetIds: ['a-housemenu'], source: 'smart' })
      } else if (s.id === 'patio' && rotation.length) {
        take({ id: uid('b'), screenId: s.id, start: a, end: b, kind: 'playlist', title: 'Marketing rotation', subtitle: 'Default for signage-only TVs', assetIds: rotation, source: 'smart' })
      } else {
        take({ id: uid('b'), screenId: s.id, start: a, end: b, kind: 'playlist', title: PLAYLIST_NAMES.balanced, subtitle: 'Default playlist', source: 'smart' })
      }
    }
  }
  return proposed
}
