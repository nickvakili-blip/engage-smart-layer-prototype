import type { Asset, Block, Game, MenuSection, Screen } from '../types'
import { CLOSE, OPEN, todayStamp } from '../lib/time'

export const VENUE = {
  name: 'Copper Tap Kitchen & Bar',
  short: 'Copper Tap',
  org: 'DTV Demo Company',
  monogram: 'CT',
  primary: '#1f4d3a',
  accent: '#e8a33d',
}

export const SCREENS: Screen[] = [
  { id: 'bar1', name: 'Bar TV 1', zone: 'Bar', kind: 'tv', core: true },
  { id: 'bar2', name: 'Bar TV 2', zone: 'Bar', kind: 'tv', core: true },
  { id: 'dining', name: 'Dining Room', zone: 'Dining', kind: 'tv', core: true },
  { id: 'patio', name: 'Patio', zone: 'Outdoor', kind: 'tv', core: false },
  { id: 'private', name: 'Private Room', zone: 'Events', kind: 'tv', core: true },
  { id: 'host', name: 'Host Stand', zone: 'Entrance', kind: 'menu', core: false },
]

/** Live-sports (Core) TVs, in the order to try when auto-placing a game */
export const GAME_SCREEN_PREFERENCE = ['bar1', 'bar2', 'dining', 'private']

const h = (hh: number, mm = 0) => hh * 60 + mm

export const GAMES: Game[] = [
  // Today
  { id: 'g-ucl1', league: 'Champions League', home: 'Arsenal', away: 'Bayern Munich', day: 0, start: h(14), end: h(16), network: 'Paramount+', tags: ['ucl', 'soccer'] },
  { id: 'g-ucl2', league: 'Champions League', home: 'Real Madrid', away: 'Inter', day: 0, start: h(14), end: h(16), network: 'Paramount+', tags: ['ucl', 'soccer'] },
  { id: 'g-nba1', league: 'NBA', home: 'Celtics', away: 'Lakers', day: 0, start: h(18, 30), end: h(21), network: 'TNT', tags: ['nba', 'primetime'] },
  { id: 'g-mlb', league: 'World Series · Game 3', home: 'Yankees', away: 'Dodgers', day: 0, start: h(19), end: h(22, 30), network: 'FOX', tags: ['mlb', 'primetime'] },
  { id: 'g-nhl', league: 'NHL', home: 'Blackhawks', away: 'Blues', day: 0, start: h(19), end: h(21, 30), network: 'ESPN+', tags: ['nhl', 'blackhawks', 'primetime'] },
  { id: 'g-nba2', league: 'NBA', home: 'Bulls', away: 'Knicks', day: 0, start: h(19), end: h(21, 30), network: 'Chicago Sports Network', tags: ['nba', 'bulls', 'primetime'] },
  // Upcoming
  { id: 'g-ucl3', league: 'Champions League', home: 'Liverpool', away: 'PSG', day: 1, start: h(14), end: h(16), network: 'Paramount+', tags: ['ucl', 'soccer'] },
  { id: 'g-nhl2', league: 'NHL', home: 'Wild', away: 'Blackhawks', day: 1, start: h(19), end: h(21, 30), network: 'ESPN+', tags: ['nhl', 'blackhawks', 'primetime'] },
  { id: 'g-nba3', league: 'NBA', home: 'Bucks', away: 'Bulls', day: 2, start: h(19), end: h(21, 30), network: 'Chicago Sports Network', tags: ['nba', 'bulls', 'primetime'] },
  { id: 'g-tnf1', league: 'NFL · TNF', home: 'Vikings', away: 'Chargers', day: 2, start: h(19, 15), end: h(22, 30), network: 'Prime Video', tags: ['nfl', 'primetime'] },
  { id: 'g-epl1', league: 'Premier League', home: 'Man City', away: 'Arsenal', day: 4, start: h(11, 30), end: h(13, 30), network: 'USA Network', tags: ['epl', 'soccer'] },
  { id: 'g-nhl3', league: 'NHL', home: 'Blackhawks', away: 'Red Wings', day: 4, start: h(18), end: h(20, 30), network: 'Chicago Sports Network', tags: ['nhl', 'blackhawks', 'primetime'] },
  { id: 'g-nfl1', league: 'NFL', home: 'Eagles', away: 'Giants', day: 5, start: h(12), end: h(15, 15), network: 'FOX', tags: ['nfl', 'eagles'] },
  { id: 'g-nfl2', league: 'NFL', home: 'Bears', away: 'Packers', day: 5, start: h(12), end: h(15, 15), network: 'CBS', tags: ['nfl', 'bears'] },
  { id: 'g-epl2', league: 'Premier League', home: 'Chelsea', away: 'Tottenham', day: 5, start: h(11), end: h(13), network: 'Peacock', tags: ['epl', 'soccer'] },
  { id: 'g-mnf', league: 'NFL · MNF', home: 'Rams', away: 'Bears', day: 6, start: h(19, 15), end: h(22, 30), network: 'ESPN', tags: ['nfl', 'bears', 'primetime'] },
  { id: 'g-tnf2', league: 'NFL · TNF', home: 'Commanders', away: 'Eagles', day: 9, start: h(19, 15), end: h(22, 30), network: 'Prime Video', tags: ['nfl', 'eagles', 'primetime'] },
  { id: 'g-epl3', league: 'Premier League', home: 'Liverpool', away: 'Man United', day: 11, start: h(11, 30), end: h(13, 30), network: 'USA Network', tags: ['epl', 'soccer'] },
  { id: 'g-nfl3', league: 'NFL', home: 'Cowboys', away: 'Eagles', day: 12, start: h(15, 25), end: h(18, 30), network: 'FOX', tags: ['nfl', 'eagles'] },
  { id: 'g-nfl4', league: 'NFL', home: 'Lions', away: 'Bears', day: 12, start: h(12), end: h(15, 15), network: 'FOX', tags: ['nfl', 'bears'] },
  { id: 'g-nfl5', league: 'NFL', home: 'Eagles', away: 'Seahawks', day: 19, start: h(15, 25), end: h(18, 30), network: 'CBS', tags: ['nfl', 'eagles'] },
]

export const FOLLOWS = [
  { id: 'eagles', label: 'Eagles', league: 'NFL', tag: 'eagles', color: '#004c54' },
  { id: 'bears', label: 'Bears', league: 'NFL', tag: 'bears', color: '#0b162a' },
  { id: 'bulls', label: 'Bulls', league: 'NBA', tag: 'bulls', color: '#ce1141' },
  { id: 'blackhawks', label: 'Blackhawks', league: 'NHL', tag: 'blackhawks', color: '#cf0a2c' },
  { id: 'nfl', label: 'All NFL', league: 'League', tag: 'nfl', color: '#013369' },
  { id: 'epl', label: 'Premier League', league: 'League', tag: 'epl', color: '#3d195b' },
  { id: 'ucl', label: 'Champions League', league: 'League', tag: 'ucl', color: '#0a2a6b' },
]

export function gameTitle(g: Game): string {
  return `${g.away} at ${g.home}`
}

export const SAMPLE_MENU: MenuSection[] = [
  {
    id: 'm1', title: 'Starters', items: [
      { id: 'i1', name: 'Buffalo Wings', price: '$14' },
      { id: 'i2', name: 'Pretzel Bites', price: '$11' },
      { id: 'i3', name: 'Loaded Nachos', price: '$13' },
    ],
  },
  {
    id: 'm2', title: 'Burgers & Sandwiches', items: [
      { id: 'i4', name: 'Tap House Burger', price: '$16' },
      { id: 'i5', name: 'Crispy Chicken Sandwich', price: '$15' },
      { id: 'i6', name: 'French Dip', price: '$17' },
    ],
  },
  {
    id: 'm3', title: 'On Draft', items: [
      { id: 'i7', name: 'Guinness', price: '$8' },
      { id: 'i8', name: 'Local IPA', price: '$7' },
      { id: 'i9', name: 'House Lager', price: '$6' },
    ],
  },
]

const stamp = todayStamp()

export const SEED_ASSETS: Asset[] = [
  { id: 'a-paramount', name: 'Paramount', kind: 'spotlight', createdAt: stamp, enabled: true, owner: '-', poster: { bg: 'linear-gradient(120deg,#0b3ea8,#1f6fff 60%,#7fb2ff)', kicker: 'Champions League', title: 'WATCH HERE', accent: '#ffffff' } },
  { id: 'a-sundayticket', name: 'Sunday Ticket', kind: 'spotlight', createdAt: stamp, enabled: true, owner: '-', poster: { bg: 'linear-gradient(120deg,#0e2a1c,#1d5a36 55%,#2c7a49)', kicker: 'NFL Sunday Ticket', title: 'SUNDAYS START HERE', accent: '#ffd34d' } },
  { id: 'a-tnf', name: 'TNF', kind: 'spotlight', createdAt: stamp, enabled: true, owner: '-', poster: { bg: 'linear-gradient(120deg,#08184a,#123a8c 60%,#1aa3c9)', kicker: 'Thursday Night Football', title: 'WATCH HERE', accent: '#7fe3ff' } },
  { id: 'a-pl', name: 'Premier League', kind: 'spotlight', createdAt: stamp, enabled: true, owner: '-', poster: { bg: 'linear-gradient(120deg,#3d195b,#7a2fa0 55%,#e90052)', kicker: 'Premier League', title: 'WATCH HERE', accent: '#04f5ff' } },
  { id: 'a-happyhour', name: 'Happy Hour Specials', kind: 'spotlight', createdAt: stamp, enabled: true, owner: 'Nick', poster: { bg: 'linear-gradient(120deg,#5a2a0c,#b5651d 60%,#e8a33d)', kicker: 'Mon–Fri · 3–6pm', title: '$5 DRAFTS', accent: '#fff3d6' } },
  { id: 'a-housemenu', name: 'House Menu', kind: 'menu', createdAt: stamp, enabled: true, owner: 'Nick', menu: { title: 'Copper Tap Menu', columns: 2, sections: SAMPLE_MENU } },
]

/** The marketing rotation: the playlist of promos that plays on marketing blocks */
export const SEED_ROTATION = ['a-happyhour', 'a-paramount', 'a-sundayticket']

export const PLAYLIST_NAMES = {
  balanced: 'Balanced Mix',
  entertainment: 'Entertainment Heavy',
  promotion: 'Promotion Heavy',
}

export const SEED_BLOCKS: Block[] = [
  { id: 'b1', screenId: 'bar1', start: OPEN, end: h(17), kind: 'playlist', title: PLAYLIST_NAMES.balanced, subtitle: 'Smart Playlist', source: 'existing' },
  { id: 'b2', screenId: 'bar1', start: h(19), end: h(22, 30), kind: 'game', title: 'Dodgers at Yankees', subtitle: 'World Series · FOX', gameId: 'g-mlb', source: 'existing' },
  { id: 'b3', screenId: 'bar2', start: OPEN, end: h(14), kind: 'playlist', title: PLAYLIST_NAMES.entertainment, subtitle: 'Smart Playlist', source: 'existing' },
  { id: 'b4', screenId: 'bar2', start: h(18, 30), end: h(21), kind: 'game', title: 'Lakers at Celtics', subtitle: 'NBA · TNT', gameId: 'g-nba1', source: 'existing' },
  { id: 'b5', screenId: 'dining', start: OPEN, end: h(21), kind: 'playlist', title: PLAYLIST_NAMES.promotion, subtitle: 'Smart Playlist', source: 'existing' },
  { id: 'b6', screenId: 'patio', start: h(17), end: h(19), kind: 'marketing', title: 'Happy Hour rotation', subtitle: 'Marketing playlist', assetIds: SEED_ROTATION, source: 'existing' },
  { id: 'b7', screenId: 'host', start: OPEN, end: CLOSE, kind: 'menu', title: 'House Menu', subtitle: 'Menu board', assetIds: ['a-housemenu'], source: 'existing' },
]
