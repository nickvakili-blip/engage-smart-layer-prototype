import { Link } from 'react-router-dom'
import type { Block } from '../../types'
import { SCREENS } from '../../data/seed'
import { KIND_META, gapsFor } from '../../lib/schedule'
import { CLOSE, NOW, OPEN, fmtRange, fmtTime } from '../../lib/time'
import { Icon } from '../../ui/Icon'

const SPAN = CLOSE - OPEN
const pct = (t: number) => `${((t - OPEN) / SPAN) * 100}%`
const width = (a: number, b: number) => `${((b - a) / SPAN) * 100}%`
const HOURS = Array.from({ length: SPAN / 60 + 1 }, (_, i) => OPEN + i * 60)

export function Legend({ kinds = ['game', 'marketing', 'autogame', 'playlist'] as const }: { kinds?: readonly (keyof typeof KIND_META)[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-gray-700">
      {kinds.map((k) => (
        <span key={k} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${KIND_META[k].dot}`} />{KIND_META[k].legend}</span>
      ))}
      <span className="flex items-center gap-1.5"><span className="gap-hatch h-2.5 w-4 rounded-sm border border-alert/40" />Nothing scheduled</span>
    </div>
  )
}

export function DayTimeline({
  blocks,
  proposed = [],
  onRemove,
  showGaps = true,
  screenIds,
  focus,
}: {
  blocks: Block[]
  proposed?: Block[]
  onRemove?: (id: string) => void
  showGaps?: boolean
  screenIds?: string[]
  focus?: { screenId: string; start: number; end: number }
}) {
  const screens = SCREENS.filter((s) => !screenIds || screenIds.includes(s.id))
  const all = [...blocks, ...proposed]
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <div className="min-w-[900px]">
        <div className="flex border-b bg-gray-50">
          <div className="w-36 shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">TV</div>
          <div className="relative h-8 flex-1">
            {HOURS.map((h) => (
              <span key={h} className={`absolute top-2 text-[11px] font-semibold text-gray-500 ${h === CLOSE ? '-translate-x-full pr-1' : '-translate-x-1/2'}`} style={{ left: pct(h) }}>
                {h === OPEN ? '' : fmtTime(h, true)}
              </span>
            ))}
          </div>
        </div>
        {screens.map((s) => {
          const gaps = showGaps ? gapsFor(all, s.id) : []
          return (
            <div key={s.id} className="flex border-b last:border-0">
              <Link to={`/advanced/schedule?screen=${s.id}`} className="group w-36 shrink-0 px-3 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-1.5 text-sm font-bold"><Icon name={s.kind === 'menu' ? 'menu' : 'tv'} className="h-4 w-4 text-gray-500" />{s.name}</div>
                <div className="text-[11px] text-gray-500">{s.kind === 'menu' ? 'Menu board' : s.core ? 'Live sports + signage' : 'Signage only'}</div>
              </Link>
              <div className="relative h-[68px] flex-1">
                {HOURS.map((h) => <span key={h} className="absolute inset-y-0 w-px bg-gray-100" style={{ left: pct(h) }} />)}
                {gaps.map(([a, b]) => (
                  <div key={a} className="gap-hatch absolute inset-y-1.5 flex items-center justify-center overflow-hidden rounded-md border border-dashed border-alert/50" style={{ left: pct(a), width: width(a, b) }}>
                    {b - a >= 90 && <span className="truncate px-1 text-[11px] font-bold text-alert">Nothing scheduled · {fmtRange(a, b)}</span>}
                  </div>
                ))}
                {blocks.filter((b) => b.screenId === s.id).map((b) => <BlockBar key={b.id} block={b} />)}
                {proposed.filter((b) => b.screenId === s.id).map((b) => (
                  <BlockBar key={b.id} block={b} proposed delay={proposed.indexOf(b) * 90} onRemove={onRemove ? () => onRemove(b.id) : undefined} />
                ))}
                {focus?.screenId === s.id && (
                  <div className="pointer-events-none absolute inset-y-0.5 rounded-md ring-2 ring-ink ring-offset-1" style={{ left: pct(focus.start), width: width(focus.start, focus.end) }} />
                )}
                <span className="absolute inset-y-0 z-10 w-0.5 bg-alert" style={{ left: pct(NOW) }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex min-w-[900px] items-center gap-2 border-t bg-gray-50 px-3 py-1.5 text-[11px] text-gray-500">
        <span className="h-2 w-0.5 bg-alert" /> Now · {fmtTime(NOW)} · Times in America/Chicago
      </div>
    </div>
  )
}

function BlockBar({ block: b, proposed, delay = 0, onRemove }: { block: Block; proposed?: boolean; delay?: number; onRemove?: () => void }) {
  const m = KIND_META[b.kind]
  const narrow = b.end - b.start < 75
  return (
    <div
      className={`group absolute inset-y-1.5 overflow-hidden rounded-md border-l-4 px-2 py-1 ${m.bg} ${m.border} ${proposed ? 'animate-pop border-y border-r border-dashed' : ''}`}
      style={{ left: pct(b.start), width: width(b.start, b.end), animationDelay: `${delay}ms` }}
      title={`${b.title} · ${fmtRange(b.start, b.end)}${b.note ? ` · ${b.note}` : ''}`}
    >
      <div className={`truncate text-xs font-bold ${m.text}`}>{narrow ? '' : b.title}</div>
      {!narrow && <div className="truncate text-[11px] text-gray-600">{fmtRange(b.start, b.end)}{proposed ? ' · Proposed' : ''}</div>}
      {onRemove && (
        <button onClick={onRemove} className="absolute right-1 top-1 hidden rounded bg-white/90 p-0.5 text-gray-600 shadow group-hover:block" aria-label={`Remove ${b.title}`}>
          <Icon name="x" className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
