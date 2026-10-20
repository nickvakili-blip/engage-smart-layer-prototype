import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Block } from '../../types'
import { useStore } from '../../state/store'
import { SCREENS } from '../../data/seed'
import { KIND_META, placeBlock, proposeFill, totalGapMinutes, unplacedGames } from '../../lib/schedule'
import { fmtHours, fmtRange, todayLong } from '../../lib/time'
import { Container, PageHeader, ReviewLink } from '../../ui/common'
import { Icon } from '../../ui/Icon'
import { DayTimeline, Legend } from './DayTimeline'

const keyOf = (b: Block) => `${b.screenId}:${b.start}:${b.kind}`
const ORDER: Block['kind'][] = ['game', 'marketing', 'autogame', 'menu', 'playlist']
const GROUP_TITLES: Record<Block['kind'], string> = {
  game: 'Live games your rules asked for',
  marketing: 'Marketing your rules asked for',
  autogame: "Today's live games",
  menu: 'Menu boards',
  playlist: 'Default playlists for the rest',
}

export default function FillMyDay() {
  const { blocks, rules, rotation, setBlocks, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') ?? 'review'
  const [removed, setRemoved] = useState<string[]>([])

  const proposals = useMemo(() => proposeFill(blocks, rules, rotation), [blocks, rules, rotation])
  const kept = proposals.filter((p) => !removed.includes(keyOf(p)))
  const gaps = totalGapMinutes(blocks)
  const missedGames = unplacedGames([...blocks, ...kept])

  const setView = (v: string) => {
    setParams(v === 'review' ? {} : { view: v })
    window.scrollTo({ top: 0 })
  }

  const apply = () => {
    setBlocks((bs) => kept.reduce((cur, p) => placeBlock(cur, { ...p, note: undefined }).blocks, bs))
    toast(`Filled ${new Set(kept.map((k) => k.screenId)).size} screens`, { to: '/advanced/schedule', label: 'Review in Advanced' })
    setRemoved([])
    setView('done')
  }

  const groups = ORDER.map((k) => ({ kind: k, items: kept.filter((p) => p.kind === k) })).filter((g) => g.items.length)

  return (
    <Container wide>
      <PageHeader
        back={{ to: '/smart', label: 'Smart Home' }}
        eyebrow={`Schedule · ${todayLong()}`}
        title="Fill my day"
        subtitle="We look at what's already on every TV, find the gaps, and fill them: live games first, then marketing, then your default playlist."
        right={<ReviewLink to="/advanced/schedule" className="hidden md:inline-flex" />}
      />

      {view === 'done' || (view === 'review' && gaps.screens === 0) ? (
        <div className="animate-slideup mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white"><Icon name="check" className="h-6 w-6" strokeWidth={2.5} /></span>
          <div className="flex-1">
            <div className="text-lg font-bold">Every screen has something on from open to close.</div>
            <div className="text-sm text-gray-700">Live games take over their TV when they start. When a game ends, the TV goes back to its playlist.</div>
          </div>
          <Link to="/smart" className="btn-primary">Back to Smart Home</Link>
        </div>
      ) : view === 'review' ? (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-alert/30 bg-alert/5 p-5">
          <div className="flex-1">
            <div className="text-lg font-bold">{gaps.screens} of {SCREENS.length} screens have gaps today</div>
            <div className="text-sm text-gray-700">{fmtHours(gaps.minutes)} with nothing scheduled, shown in red below.</div>
          </div>
          <button className="btn-primary px-8 py-3 text-base" onClick={() => setView('proposed')}>Fill my day</button>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex-1">
            <div className="text-lg font-bold">Here's the plan: {kept.length} additions across {new Set(kept.map((k) => k.screenId)).size} screens</div>
            <div className="text-sm text-gray-700">Nothing changes on your TVs until you apply. Remove anything you don't want.</div>
          </div>
          <button className="btn-outline" onClick={() => { setRemoved([]); setView('review') }}>Start over</button>
          <button className="btn-primary px-8" disabled={!kept.length} onClick={apply}>Apply</button>
        </div>
      )}

      <div className="mb-3"><Legend /></div>
      <DayTimeline blocks={blocks} proposed={view === 'proposed' ? kept : []} onRemove={(id) => { const p = kept.find((k) => k.id === id); if (p) setRemoved((r) => [...r, keyOf(p)]) }} />

      {view === 'proposed' && (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {groups.map((g) => (
            <div key={g.kind} className="card p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold"><span className={`h-2.5 w-2.5 rounded-full ${KIND_META[g.kind].dot}`} />{GROUP_TITLES[g.kind]} <span className="text-gray-400">· {g.items.length}</span></h3>
              <ul className="divide-y">
                {g.items.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{p.title}</div>
                      <div className="text-gray-500">{SCREENS.find((s) => s.id === p.screenId)?.name} · {fmtRange(p.start, p.end)}{p.subtitle ? ` · ${p.subtitle}` : ''}</div>
                      {p.note && <div className="text-xs font-semibold text-amber-700">{p.note}</div>}
                    </div>
                    <button className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => setRemoved((r) => [...r, keyOf(p)])} aria-label={`Remove ${p.title}`}><Icon name="x" className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {missedGames.length > 0 && (
            <div className="card p-4 lg:col-span-2">
              <h3 className="mb-1 font-bold">Not placed</h3>
              <p className="text-sm text-gray-600">{missedGames.map((g) => `${g.away} at ${g.home}`).join(', ')}: every live-sports TV is busy then.</p>
            </div>
          )}
        </div>
      )}

      {view === 'done' && (
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <span className="text-sm text-gray-600">Review each TV in Advanced mode:</span>
          {SCREENS.map((s) => <ReviewLink key={s.id} to={`/advanced/schedule?screen=${s.id}`} label={s.name} />)}
        </div>
      )}
    </Container>
  )
}
