import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { GamesRule, Recurrence } from '../../types'
import { useStore } from '../../state/store'
import { FOLLOWS, GAMES, SCREENS, gameTitle } from '../../data/seed'
import { applyGamesRule, matchesRule, placeBlock, gameBlock } from '../../lib/schedule'
import { dayLabel, fmtRange, uid } from '../../lib/time'
import { Container, PageHeader, ReviewLink, ScreenPicker, Section, Segmented } from '../../ui/common'
import { Icon } from '../../ui/Icon'
import { DayTimeline } from './DayTimeline'

const RECURRENCE: { value: Recurrence; label: string; phrase: string }[] = [
  { value: 'every', label: 'Every game', phrase: 'every game' },
  { value: 'weekends', label: 'Weekends only', phrase: 'every weekend' },
  { value: 'primetime', label: 'Nights only', phrase: 'night games only' },
]

export default function GamesOnTv() {
  const [params, setParams] = useSearchParams()
  const { blocks, rules, addRule, setBlocks, toast } = useStore()
  const [follow, setFollow] = useState(params.get('follow') ?? '')
  const [screen, setScreen] = useState(params.get('screen') && SCREENS.find((s) => s.id === params.get('screen') && s.core) ? params.get('screen')! : '')
  const [recurrence, setRecurrence] = useState<Recurrence>((params.get('recurrence') as Recurrence) ?? 'every')
  const [result, setResult] = useState<{ placed: string[]; conflicts: string[] } | null>(null)
  const savedRule = rules.find((r): r is GamesRule => r.kind === 'games' && r.id === params.get('saved'))

  const f = FOLLOWS.find((x) => x.id === follow)
  const s = SCREENS.find((x) => x.id === screen)
  const upcoming = useMemo(() => (follow ? GAMES.filter((g) => matchesRule(g, { follow, recurrence })).sort((a, b) => a.day - b.day || a.start - b.start) : []), [follow, recurrence])

  const todayStatus = (gid: string) => {
    const g = GAMES.find((x) => x.id === gid)!
    if (g.day !== 0 || !screen) return null
    const res = placeBlock(blocks.filter((b) => !(b.gameId === g.id && b.kind === 'autogame')), gameBlock(g, screen, 'game'))
    if (res.placed) return res.trimmed.length ? { ok: true, text: `Replaces ${res.trimmed.map((t) => t.title).join(', ')} for the game` } : { ok: true, text: 'TV is free' }
    return { ok: false, text: `Clashes with ${res.conflict?.title}. The game already on finishes first.` }
  }

  const save = () => {
    if (!f || !s) return
    const rule: GamesRule = { id: uid('r'), kind: 'games', follow, screenId: screen, recurrence, createdAt: new Date().toISOString() }
    addRule(rule)
    const res = applyGamesRule(blocks, rule)
    setBlocks(() => res.blocks)
    setResult({ placed: res.placed.map((g) => gameTitle(g)), conflicts: res.conflicts.map((c) => `${gameTitle(c.game)} clashes with ${c.with.title}`) })
    toast(`${f.label} games will play on ${s.name}`, { to: `/advanced/schedule?screen=${screen}`, label: 'Review in Advanced' })
    setParams({ saved: rule.id })
  }

  if (savedRule) {
    const sf = FOLLOWS.find((x) => x.id === savedRule.follow)!
    const ss = SCREENS.find((x) => x.id === savedRule.screenId)!
    const next = GAMES.filter((g) => matchesRule(g, savedRule)).sort((a, b) => a.day - b.day || a.start - b.start).slice(0, 3)
    return (
      <Container>
        <div className="animate-slideup mx-auto max-w-xl text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-mint"><Icon name="check" className="h-7 w-7" strokeWidth={3} /></span>
          <h1 className="text-2xl font-bold">{sf.label} games on {ss.name}, {RECURRENCE.find((r) => r.value === savedRule.recurrence)!.phrase}</h1>
          <p className="mt-2 text-gray-600">You won't need to program them again. When a game ends, the TV goes back to its playlist and the next game is lined up.</p>
          {result?.placed.length ? <p className="mt-3 font-semibold">Added today: {result.placed.join(', ')}</p> : null}
          {result?.conflicts.map((c) => <p key={c} className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{c}. The game already on finishes first.</p>)}
          <ul className="mt-6 divide-y rounded-xl border text-left">
            {next.map((g) => (
              <li key={g.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="w-24 shrink-0 font-semibold">{dayLabel(g.day)}</span>
                <span className="flex-1">{gameTitle(g)}<span className="block text-gray-500">{fmtRange(g.start, g.end)} · {g.network}</span></span>
                <span className="badge bg-grape/10 text-grape">Lined up</span>
              </li>
            ))}
            {!next.length && <li className="p-3 text-sm text-gray-500">No games in the current schedule. We'll pick them up as soon as they're announced.</li>}
          </ul>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn-outline" onClick={() => { setResult(null); setFollow(''); setScreen(''); setParams({}) }}>Add another team</button>
            <Link to="/smart" className="btn-primary">Back to Smart Home</Link>
          </div>
          <ReviewLink to={`/advanced/schedule?screen=${ss.id}`} className="mt-4" />
        </div>
      </Container>
    )
  }

  return (
    <Container wide>
      <PageHeader
        back={{ to: '/smart', label: 'Smart Home' }}
        eyebrow="Schedule"
        title="Games on a TV"
        subtitle="Pick a team or league and a TV. Their games go on that TV automatically, every time."
        right={<ReviewLink to="/advanced/schedule" className="hidden md:inline-flex" />}
      />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Section n={1} title="Who do you want to follow?">
            <div className="flex flex-wrap gap-2">
              {FOLLOWS.map((x) => (
                <button key={x.id} className={`chip ${follow === x.id ? 'chip-on' : 'chip-off'}`} onClick={() => setFollow(x.id)}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
                  {x.label}
                  <span className={`text-xs ${follow === x.id ? 'text-white/70' : 'text-gray-400'}`}>{x.league}</span>
                </button>
              ))}
            </div>
          </Section>
          <Section n={2} title="On which TV?" hint="Only TVs that get live sports are shown.">
            <ScreenPicker value={screen ? [screen] : []} onChange={(v) => setScreen(v[0])} filter={(x) => x.core} />
          </Section>
          <Section n={3} title="How often?">
            <Segmented value={recurrence} onChange={setRecurrence} options={RECURRENCE} />
          </Section>
        </div>
        <div>
          <div className="card p-5 lg:sticky lg:top-28">
            <div className="eyebrow mb-2">Summary</div>
            {f && s ? (
              <p className="text-lg font-bold">{f.label} games on {s.name}, {RECURRENCE.find((r) => r.value === recurrence)!.phrase}.</p>
            ) : (
              <p className="text-gray-500">Pick a team and a TV to see their next games.</p>
            )}
            {f && (
              <>
                <div className="mt-4 text-sm font-semibold">Next games</div>
                <ul className="mt-2 divide-y text-sm">
                  {upcoming.slice(0, 4).map((g) => {
                    const st = todayStatus(g.id)
                    return (
                      <li key={g.id} className="py-2">
                        <div className="flex justify-between gap-2"><span className="font-semibold">{gameTitle(g)}</span><span className="shrink-0 text-gray-500">{dayLabel(g.day)}</span></div>
                        <div className="text-gray-500">{fmtRange(g.start, g.end)} · {g.network}</div>
                        {st && <div className={`text-xs font-semibold ${st.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{st.text}</div>}
                      </li>
                    )
                  })}
                  {!upcoming.length && <li className="py-2 text-gray-500">No matching games in the schedule yet.</li>}
                </ul>
              </>
            )}
            <button className="btn-primary mt-5 w-full" disabled={!f || !s} onClick={save}>Save</button>
            <p className="mt-2 text-center text-xs text-gray-500">When a game ends, the next one is lined up automatically.</p>
          </div>
        </div>
      </div>
      {s && (
        <div className="mt-6">
          <div className="eyebrow mb-2">Today on {s.name}</div>
          <DayTimeline blocks={blocks} screenIds={[s.id]} />
        </div>
      )}
    </Container>
  )
}
