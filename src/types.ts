export type ScreenKind = 'tv' | 'menu'

export interface Screen {
  id: string
  name: string
  zone: string
  kind: ScreenKind
  /** Also receives live sports through Core */
  core: boolean
}

export type AssetKind = 'spotlight' | 'qr' | 'menu'

export interface MenuItem { id: string; name: string; price: string; note?: string }
export interface MenuSection { id: string; title: string; items: MenuItem[] }

export interface SpotlightData {
  image: string
  headline: string
  offer: string
  subline: string
  layout: 'panel' | 'band' | 'overlay'
  qrUrl?: string
}
export interface QrData { url: string; label: string; mode: 'full' | 'spotlight'; spotlightId?: string }
export interface MenuData { title: string; columns: 1 | 2; sections: MenuSection[]; image?: string }

/** Pre-existing promos from Advanced mode render as a stylised poster */
export interface PosterData { bg: string; title: string; kicker: string; accent: string }

export interface Asset {
  id: string
  name: string
  kind: AssetKind
  createdAt: string
  enabled: boolean
  owner: string
  /** Created through the Smart layer during this demo */
  fromSmart?: boolean
  spotlight?: SpotlightData
  qr?: QrData
  menu?: MenuData
  poster?: PosterData
}

/**
 * Block priority mirrors the PRD fill order:
 * game (scheduled live game) > marketing > autogame (auto-filled live) > playlist/default
 */
export type BlockKind = 'game' | 'marketing' | 'autogame' | 'playlist' | 'menu'

export interface Block {
  id: string
  screenId: string
  /** minutes from midnight, today */
  start: number
  end: number
  kind: BlockKind
  title: string
  subtitle?: string
  gameId?: string
  assetIds?: string[]
  ruleId?: string
  /** Shown on proposals that replace lower-priority content */
  note?: string
  source: 'existing' | 'smart'
}

export interface Game {
  id: string
  league: string
  home: string
  away: string
  /** day offset from today (0 = today) */
  day: number
  start: number
  end: number
  network: string
  tags: string[]
}

export type Recurrence = 'every' | 'weekends' | 'primetime'

export interface GamesRule {
  id: string
  kind: 'games'
  follow: string
  screenId: string
  recurrence: Recurrence
  createdAt: string
}
export interface MarketingRule {
  id: string
  kind: 'marketing'
  assetIds: string[]
  screenId: string
  start: number
  end: number
  repeat: 'today' | 'daily' | 'weekdays'
  createdAt: string
}
export type Rule = GamesRule | MarketingRule

export interface Toast { id: string; message: string; link?: { to: string; label: string } }
