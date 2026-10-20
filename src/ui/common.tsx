import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { SCREENS } from '../data/seed'
import type { Screen } from '../types'

export function PageHeader({ back, eyebrow, title, subtitle, right }: { back?: { to: string; label: string }; eyebrow?: string; title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      {back && (
        <Link to={back.to} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-pine hover:underline">
          <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.5} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
          <h1 className="h-page">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-gray-600 md:text-base">{subtitle}</p>}
        </div>
        {right}
      </div>
    </div>
  )
}

export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6 flex gap-2 md:mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-start gap-1.5 md:max-w-[120px]">
          <span className={`text-xs font-semibold ${i <= current ? 'text-ink' : 'text-gray-400'}`}>{s}</span>
          <span className={`h-2.5 w-full rounded-full border-2 ${i < current ? 'border-ink bg-ink' : i === current ? 'border-pine bg-pine' : 'border-gray-300 bg-white'}`} />
        </div>
      ))}
    </div>
  )
}

export function ReviewLink({ to, label = 'Review in Advanced', className = '' }: { to: string; label?: string; className?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-1 text-sm font-semibold text-pine hover:underline ${className}`}>
      {label} <Icon name="arrowUpRight" className="h-4 w-4" />
    </Link>
  )
}

export function ScreenPicker({ value, onChange, multi = false, filter }: { value: string[]; onChange: (v: string[]) => void; multi?: boolean; filter?: (s: Screen) => boolean }) {
  const screens = SCREENS.filter(filter ?? (() => true))
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {screens.map((s) => {
        const on = value.includes(s.id)
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(multi ? (on ? value.filter((v) => v !== s.id) : [...value, s.id]) : [s.id])}
            className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition ${on ? 'border-pine bg-pine-light' : 'border-gray-200 bg-white hover:border-gray-400'}`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${on ? 'bg-pine text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Icon name={s.kind === 'menu' ? 'menu' : 'tv'} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{s.name}</span>
              <span className="block truncate text-xs text-gray-500">{s.kind === 'menu' ? 'Menu board' : s.core ? `${s.zone} · Live sports` : `${s.zone} · Signage`}</span>
            </span>
            {on && <Icon name="check" className="ml-auto h-5 w-5 shrink-0 text-pine" strokeWidth={2.5} />}
          </button>
        )
      })}
    </div>
  )
}

export function OptionCard({ selected, onClick, icon, title, body, disabled }: { selected: boolean; onClick: () => void; icon: string; title: string; body: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-full flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition disabled:opacity-40 ${selected ? 'border-pine bg-pine-light' : 'border-gray-200 bg-white hover:border-gray-400'}`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${selected ? 'bg-pine text-white' : 'bg-gray-100 text-gray-700'}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="font-semibold">{title}</span>
      <span className="text-sm text-gray-600">{body}</span>
    </button>
  )
}

export function Segmented<T extends string | number>({ options, value, onChange }: { options: { value: T; label: string; icon?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${value === o.value ? 'bg-white shadow-card' : 'text-gray-600 hover:text-ink'}`}
        >
          {o.icon && <Icon name={o.icon} className="h-4 w-4" />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Section({ n, title, hint, children }: { n?: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        {n !== undefined && <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-white">{n}</span>}
        {title}
      </h2>
      {hint && <p className="mb-3 text-sm text-gray-600">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  )
}

export function Container({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-4 pt-6 md:px-10 md:pt-10 ${wide ? 'max-w-[1400px]' : 'max-w-[1040px]'}`}>{children}</div>
}

export function AutoChecklist({ items, done }: { items: string[]; done: number }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={it} className={`flex items-center gap-2 text-sm transition ${i < done ? 'text-ink' : 'text-gray-400'}`}>
          <span className={`grid h-5 w-5 place-items-center rounded-full ${i < done ? 'bg-mint text-ink' : 'bg-gray-200'}`}>
            {i < done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />}
          </span>
          {it}
        </li>
      ))}
    </ul>
  )
}
