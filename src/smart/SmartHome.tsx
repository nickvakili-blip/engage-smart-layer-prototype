import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Container } from '../ui/common'
import { useStore } from '../state/store'
import { SCREENS, VENUE, gameTitle } from '../data/seed'
import { KIND_META, blockAt, gapsFor, nextBlock, placeBlock, proposeFill, totalGapMinutes, unplacedGames } from '../lib/schedule'
import { NOW, fmtHours, fmtRange, fmtTime, todayLong } from '../lib/time'
import { INTENT_EXAMPLES, parseIntent } from './intent'

export const CREATE_ACTIONS = [
  { to: '/smart/create/spotlight', icon: 'spotlight', title: 'Spotlight', body: 'A photo and a few words, turned into a promo slide' },
  { to: '/smart/create/qr', icon: 'qr', title: 'QR code', body: 'A link turned into a scannable slide' },
  { to: '/smart/create/menu', icon: 'menu', title: 'Menu board', body: 'A photo or PDF of your menu, turned into a screen menu' },
]
export const SCHEDULE_ACTIONS = [
  { to: '/smart/schedule/games', icon: 'trophy', title: 'Games on a TV', body: 'Follow a team or league on a chosen TV' },
  { to: '/smart/schedule/marketing', icon: 'megaphone', title: 'Marketing on a TV', body: 'Promos on a chosen TV for a time window' },
  { to: '/smart/schedule/fill', icon: 'fill', title: 'Fill my day', body: 'Fill every gap on every TV, best content first' },
]

export function ActionGrid({ title, actions }: { title: string; actions: typeof CREATE_ACTIONS }) {
  return (
    <section>
      <h2 className="eyebrow mb-3">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-pine hover:shadow-md sm:flex-col sm:items-start sm:p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-pine text-white transition group-hover:bg-ink">
              <Icon name={a.icon} className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-[17px] font-bold">{a.title}</span>
              <span className="block text-sm text-gray-600">{a.body}</span>
            </span>
            <Icon name="chevronRight" className="ml-auto h-5 w-5 text-gray-400 sm:hidden" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export function IntentBox() {
  const [text, setText] = useState('')
  const [miss, setMiss] = useState(false)
  const navigate = useNavigate()
  const go = (t: string) => {
    const r = parseIntent(t)
    if (r) navigate(r.to)
    else setMiss(true)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    go(text)
  }
  return (
    <section className="rounded-xl bg-gray-50 p-4 md:p-5">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setMiss(false)
          }}
          placeholder="Or just tell us what you want…"
          className="field flex-1 bg-white"
          aria-label="Tell us what you want"
        />
        <button className="btn-primary px-4" disabled={!text.trim()} aria-label="Go">
          <Icon name="arrowRight" className="h-5 w-5" />
        </button>
      </form>
      {miss && <p className="mt-2 text-sm text-red-600">We couldn't match that to an action yet. Try one of the buttons above, or an example below.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {INTENT_EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => go(ex)} className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-pine hover:text-pine">
            “{ex}”
          </button>
        ))}
      </div>
    </section>
  )
}

function GamesPrompt() {
  const { blocks, rules, rotation, setBlocks, toast } = useStore()
  const [open, setOpen] = useState(false)
  const games = unplacedGames(blocks)
  const suggestions = useMemo(() => proposeFill(blocks, rules, rotation).filter((b) => b.kind === 'autogame'), [blocks, rules, rotation])
  if (!games.length) return null
  const add = (ids: string[]) => {
    setBlocks((bs) => suggestions.filter((s) => ids.includes(s.gameId!)).reduce((cur, s) => placeBlock(cur, { ...s, note: undefined }).blocks, bs))
    toast(ids.length === 1 ? 'Game added to your TVs' : `${ids.length} games added to your TVs`, { to: '/advanced/schedule', label: 'Review in Advanced' })
  }
  const placeable = games.filter((g) => suggestions.some((s) => s.gameId === g.id))
  return (
    <div className="rounded-xl border border-grape/30 bg-grape/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-grape text-white"><Icon name="trophy" className="h-5 w-5" /></span>
        <div className="min-w-[220px] flex-1">
          <div className="font-bold">{games.length} games today aren't on any of your TVs. Add them?</div>
          <div className="text-sm text-gray-600">{games.map((g) => g.home).join(', ')}</div>
        </div>
        <button className="btn-outline py-2" onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Review'}</button>
        {placeable.length > 0 && <button className="btn-primary py-2" onClick={() => add(placeable.map((g) => g.id))}>Add {placeable.length === games.length ? 'all' : placeable.length}</button>}
      </div>
      {open && (
        <ul className="mt-4 divide-y rounded-lg border bg-white">
          {games.map((g) => {
            const s = suggestions.find((x) => x.gameId === g.id)
            return (
              <li key={g.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{gameTitle(g)}</div>
                  <div className="text-gray-500">{g.league} · {g.network} · {fmtRange(g.start, g.end)}</div>
                </div>
                {s ? (
                  <>
                    <span className="text-gray-600">→ <b>{SCREENS.find((x) => x.id === s.screenId)?.name}</b>{s.note && <span className="block text-xs text-amber-700">{s.note}</span>}</span>
                    <button className="btn-ghost py-1.5" onClick={() => add([g.id])}>Add</button>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">All live-sports TVs are busy</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function GapsPrompt() {
  const { blocks } = useStore()
  const { screens, minutes } = totalGapMinutes(blocks)
  const blackNow = SCREENS.filter((s) => !blockAt(blocks, s.id, NOW))
  if (!screens) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white"><Icon name="check" className="h-5 w-5" strokeWidth={2.5} /></span>
        <div className="font-semibold">Every screen has something on from open to close today.</div>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-alert/30 bg-alert/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-alert text-white"><Icon name="alert" className="h-5 w-5" /></span>
        <div className="min-w-[220px] flex-1">
          <div className="font-bold">{screens} screens have nothing scheduled for part of today ({fmtHours(minutes)} in total).</div>
          {blackNow.length > 0 && <div className="text-sm text-gray-600">{blackNow.map((s) => s.name).join(' and ')} {blackNow.length === 1 ? 'is' : 'are'} black right now.</div>}
        </div>
        <Link to="/smart/schedule/fill" className="btn-primary py-2">Fill my day</Link>
      </div>
    </div>
  )
}

function ScreensStrip() {
  const { blocks } = useStore()
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="eyebrow">Your screens right now · {fmtTime(NOW)}</h2>
        <Link to="/smart/schedule/fill" className="text-sm font-semibold text-pine hover:underline">See the whole day</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {SCREENS.map((s) => {
          const cur = blockAt(blocks, s.id, NOW)
          const next = nextBlock(blocks, s.id, NOW)
          const gaps = gapsFor(blocks, s.id)
          const meta = cur ? KIND_META[cur.kind] : null
          return (
            <Link key={s.id} to={`/advanced/schedule?screen=${s.id}`} className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card hover:border-pine">
              <div className={`relative flex aspect-video items-center justify-center p-2 text-center ${cur ? 'bg-gradient-to-br from-gray-800 to-gray-950' : 'bg-black'}`}>
                {cur ? (
                  <div>
                    <span className={`badge mb-1 bg-white/90 ${meta!.text}`}>{meta!.label}</span>
                    <div className="line-clamp-2 text-sm font-semibold text-white">{cur.title}</div>
                  </div>
                ) : (
                  <div className="text-xs font-bold uppercase tracking-wide text-alert">Screen is black</div>
                )}
                <span className={`absolute left-2 top-2 h-2 w-2 rounded-full ${cur ? 'bg-mint' : 'bg-alert'} ${cur ? 'animate-pulse' : ''}`} />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <Icon name={s.kind === 'menu' ? 'menu' : 'tv'} className="h-4 w-4 text-gray-500" /> {s.name}
                </div>
                <div className="mt-0.5 truncate text-xs text-gray-500">
                  {next ? `Next: ${next.title} · ${fmtTime(next.start, true)}` : 'Nothing else today'}
                </div>
                {gaps.length > 0 && <div className="mt-1 text-xs font-semibold text-alert">{fmtHours(gaps.reduce((t, [a, b]) => t + b - a, 0))} unscheduled</div>}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default function SmartHome() {
  return (
    <Container wide>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 md:mb-8">
        <div>
          <div className="eyebrow mb-1">{VENUE.name} · {todayLong()}</div>
          <h1 className="h-page">Good afternoon, Nick</h1>
          <p className="mt-1 text-gray-600">What do you want on your screens?</p>
        </div>
      </div>
      <div className="space-y-6 md:space-y-8">
        <div className="grid gap-3 xl:grid-cols-2">
          <GapsPrompt />
          <GamesPrompt />
        </div>
        <ActionGrid title="Create" actions={CREATE_ACTIONS} />
        <ActionGrid title="Schedule" actions={SCHEDULE_ACTIONS} />
        <IntentBox />
        <ScreensStrip />
      </div>
    </Container>
  )
}

export function CreateHub() {
  return (
    <Container>
      <h1 className="h-page mb-6">Create</h1>
      <ActionGrid title="What are you making?" actions={CREATE_ACTIONS} />
    </Container>
  )
}

export function ScheduleHub() {
  return (
    <Container>
      <h1 className="h-page mb-6">Schedule</h1>
      <ActionGrid title="What do you want to set up?" actions={SCHEDULE_ACTIONS} />
    </Container>
  )
}
