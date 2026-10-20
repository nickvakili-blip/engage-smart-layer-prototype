/** The prototype is pinned to a single demo moment so the story is repeatable. */
export const TODAY = new Date(2026, 9, 20) // Tue Oct 20 2026
export const NOW = 12 * 60 + 15 // 12:15 PM
export const OPEN = 11 * 60 // 11:00 AM
export const CLOSE = 23 * 60 // 11:00 PM
export const TIMEZONE = 'America/Chicago'

export function fmtTime(min: number, compact = false): string {
  const h24 = Math.floor(min / 60) % 24
  const m = min % 60
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  if (compact) return m === 0 ? `${h}${ampm.toLowerCase()}` : `${h}:${String(m).padStart(2, '0')}${ampm.toLowerCase()}`
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

export function fmtRange(start: number, end: number): string {
  return `${fmtTime(start, true)}–${fmtTime(end, true)}`
}

export function fmtHours(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function dateFor(dayOffset: number): Date {
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + dayOffset)
}

export function dayLabel(dayOffset: number): string {
  if (dayOffset === 0) return 'Today'
  if (dayOffset === 1) return 'Tomorrow'
  return dateFor(dayOffset).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function isWeekend(dayOffset: number): boolean {
  const d = dateFor(dayOffset).getDay()
  return d === 0 || d === 6
}

export function todayLong(): string {
  return TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function todayStamp(): string {
  return TODAY.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

/** Half-hour options between open and close, for time pickers */
export const TIME_OPTIONS: number[] = Array.from({ length: (CLOSE - OPEN) / 30 + 1 }, (_, i) => OPEN + i * 30)

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
