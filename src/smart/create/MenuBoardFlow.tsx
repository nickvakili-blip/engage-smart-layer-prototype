import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Asset, MenuData, MenuSection } from '../../types'
import { useDraft } from '../../state/store'
import { MENU_PHOTO, readAndResize } from '../../data/images'
import { SAMPLE_MENU } from '../../data/seed'
import { todayStamp, uid } from '../../lib/time'
import { Container, PageHeader, Segmented, Steps } from '../../ui/common'
import { MenuSlide } from '../../ui/ScreenPreview'
import { Icon } from '../../ui/Icon'
import { PublishStep } from './PublishStep'

const STEPS = ['menu', 'check', 'design', 'publish'] as const
type Step = (typeof STEPS)[number]

interface Draft extends MenuData {
  id: string
  name: string
  source: string
  fileName: string
}

const initial = (): Draft => ({ id: uid('a'), name: '', title: 'Copper Tap Menu', columns: 2, sections: [], source: '', fileName: '' })

/** Simulated read of the menu. In production this calls the extraction service. */
function extract(): MenuSection[] {
  return SAMPLE_MENU.map((s) => ({ ...s, id: uid('s'), items: s.items.map((i) => ({ ...i, id: uid('i') })) }))
}

export default function MenuBoardFlow() {
  const [params, setParams] = useSearchParams()
  const [draft, update, clear] = useDraft<Draft>('menu', initial())
  const step = (STEPS.includes(params.get('step') as Step) ? params.get('step') : 'menu') as Step
  const go = (s: Step) => {
    const p = new URLSearchParams(params)
    p.set('step', s)
    setParams(p)
    window.scrollTo({ top: 0 })
  }
  const [reading, setReading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if ((step === 'check' || step === 'design') && !draft.sections.length) go('menu')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const read = (source: string, fileName: string) => {
    update({ source, fileName })
    setReading(true)
    setTimeout(() => {
      setReading(false)
      update({ sections: extract() })
      go('check')
    }, 1800)
  }

  const pick = async (file?: File) => {
    if (!file) return
    if (file.type === 'application/pdf') read('pdf', file.name)
    else read(await readAndResize(file, 1200), file.name)
  }

  const setSection = (sid: string, patch: Partial<MenuSection>) => update({ sections: draft.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)) })
  const itemCount = draft.sections.reduce((n, s) => n + s.items.length, 0)

  const menu: MenuData = { title: draft.title, columns: draft.columns, sections: draft.sections }
  const asset: Asset = { id: draft.id, name: draft.name || draft.title || 'Menu board', kind: 'menu', createdAt: todayStamp(), enabled: true, owner: 'Nick', fromSmart: true, menu }

  return (
    <Container wide={step === 'design' || step === 'publish'}>
      <PageHeader back={{ to: '/smart', label: 'Smart Home' }} eyebrow="Create" title="Menu board" subtitle="Turn the menu you already have into a menu that's easy to read on a TV." />
      <Steps steps={['Menu', 'Check', 'Design', 'Publish']} current={STEPS.indexOf(step)} />

      {step === 'menu' && (
        <div className="mx-auto max-w-2xl">
          {reading ? (
            <div className="flex flex-col items-center py-6">
              <div className="relative w-56 overflow-hidden rounded-lg shadow-lg">
                {draft.source === 'pdf' ? (
                  <div className="grid aspect-[4/5] place-items-center bg-gray-100 text-gray-500"><Icon name="menu" className="h-16 w-16" /><span className="px-2 text-center text-xs">{draft.fileName}</span></div>
                ) : (
                  <img src={draft.source} alt="Your menu" className="w-full" />
                )}
                <div className="scanline absolute inset-x-0 h-1 bg-mint shadow-[0_0_20px_6px_rgba(95,208,166,.6)]" />
              </div>
              <p className="mt-5 text-lg font-semibold">Reading your menu…</p>
              <p className="text-sm text-gray-600">Finding sections, items and prices</p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-xl font-bold">Show us your menu</h2>
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => camRef.current?.click()} className="flex items-center gap-4 rounded-xl bg-ink p-5 text-left text-white hover:bg-black/80">
                  <Icon name="camera" className="h-8 w-8" />
                  <span><span className="block text-lg font-bold">Take a photo</span><span className="text-sm text-white/70">Of your printed menu</span></span>
                </button>
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-4 rounded-xl border-2 border-ink p-5 text-left hover:bg-gray-50">
                  <Icon name="upload" className="h-8 w-8" />
                  <span><span className="block text-lg font-bold">Upload a photo or PDF</span><span className="text-sm text-gray-600">JPG, PNG or PDF</span></span>
                </button>
              </div>
              <div className="mt-8">
                <div className="eyebrow mb-3">Or try a sample</div>
                <button onClick={() => read(MENU_PHOTO, 'copper-tap-menu.jpg')} className="flex items-center gap-4 rounded-xl border-2 border-gray-200 p-3 text-left hover:border-pine">
                  <img src={MENU_PHOTO} alt="Sample printed menu" className="h-28 w-24 rounded object-cover" />
                  <span><span className="block font-bold">Copper Tap printed menu</span><span className="text-sm text-gray-600">3 sections, 9 items</span></span>
                </button>
              </div>
              <p className="mt-6 text-xs text-gray-400">Prototype note: reading the menu is simulated and always returns the sample items.</p>
            </>
          )}
        </div>
      )}

      {step === 'check' && (
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="hidden lg:block">
            {draft.source && draft.source !== 'pdf' && <img src={draft.source} alt="Your menu" className="w-full rounded-lg shadow" />}
            <p className="mt-2 text-xs text-gray-500">Your original</p>
          </div>
          <div>
            <div className="mb-5 rounded-xl bg-pine-light p-4">
              <div className="font-bold">We found {draft.sections.length} sections and {itemCount} items.</div>
              <div className="text-sm text-gray-700">Check the names and prices. Everything stays editable.</div>
            </div>
            <div className="space-y-5">
              {draft.sections.map((s) => (
                <div key={s.id} className="card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input className="field py-2 font-bold" value={s.title} onChange={(e) => setSection(s.id, { title: e.target.value })} aria-label="Section name" />
                    <button className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => update({ sections: draft.sections.filter((x) => x.id !== s.id) })} aria-label="Remove section"><Icon name="trash" className="h-5 w-5" /></button>
                  </div>
                  <div className="space-y-2">
                    {s.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-2">
                        <input className="field py-2" value={it.name} onChange={(e) => setSection(s.id, { items: s.items.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x)) })} aria-label="Item name" />
                        <input className="field w-24 py-2 text-right" value={it.price} onChange={(e) => setSection(s.id, { items: s.items.map((x) => (x.id === it.id ? { ...x, price: e.target.value } : x)) })} aria-label="Price" />
                        <button className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => setSection(s.id, { items: s.items.filter((x) => x.id !== it.id) })} aria-label="Remove item"><Icon name="x" className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  <button className="btn-ghost mt-2 px-2 py-1.5" onClick={() => setSection(s.id, { items: [...s.items, { id: uid('i'), name: '', price: '' }] })}><Icon name="plus" className="h-4 w-4" /> Add item</button>
                </div>
              ))}
              <button className="btn-outline" onClick={() => update({ sections: [...draft.sections, { id: uid('s'), title: 'New section', items: [{ id: uid('i'), name: '', price: '' }] }] })}><Icon name="plus" className="h-4 w-4" /> Add section</button>
            </div>
            <div className="mt-8 flex gap-3">
              <button className="btn-back w-32" onClick={() => go('menu')}>Back</button>
              <button className="btn-primary flex-1 sm:flex-none sm:px-10" disabled={!itemCount} onClick={() => go('design')}>See it on screen</button>
            </div>
          </div>
        </div>
      )}

      {step === 'design' && (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <MenuSlide data={menu} safeZone />
          </div>
          <div className="space-y-5">
            <div>
              <span className="label">Layout</span>
              <Segmented value={draft.columns} onChange={(columns) => update({ columns })} options={[{ value: 1, label: 'One column', icon: 'rows' }, { value: 2, label: 'Two columns', icon: 'columns' }]} />
              {draft.columns === 1 && itemCount > 10 && <p className="mt-2 text-sm text-amber-700">That's a lot of items for one column. Two columns keeps the text bigger.</p>}
            </div>
            <label className="block"><span className="label">Title on screen</span><input className="field" value={draft.title} onChange={(e) => update({ title: e.target.value })} /></label>
            <label className="block"><span className="label">Name in your library</span><input className="field" value={draft.name} placeholder={draft.title} onChange={(e) => update({ name: e.target.value })} /></label>
            <div className="flex gap-3 pt-4">
              <button className="btn-back w-32" onClick={() => go('check')}>Back</button>
              <button className="btn-primary flex-1 sm:flex-none sm:px-10" onClick={() => go('publish')}>Next: publish</button>
            </div>
          </div>
        </div>
      )}

      {step === 'publish' && (
        <PublishStep
          asset={asset}
          initialScreen="host"
          onBack={() => go('design')}
          onPublished={clear}
          onRestart={() => {
            clear()
            setParams({})
          }}
        />
      )}
    </Container>
  )
}
