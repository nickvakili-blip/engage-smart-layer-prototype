import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Asset, Block, Rule, Toast } from '../types'
import { SEED_ASSETS, SEED_BLOCKS, SEED_ROTATION } from '../data/seed'
import { uid } from '../lib/time'

interface DemoState {
  assets: Asset[]
  blocks: Block[]
  rules: Rule[]
  rotation: string[]
}

const KEY = 'engage-smart-demo-v1'

function seed(): DemoState {
  return {
    assets: SEED_ASSETS,
    blocks: SEED_BLOCKS,
    rules: [],
    rotation: SEED_ROTATION,
  }
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const ok = saved && ['assets', 'blocks', 'rules', 'rotation'].every((k) => Array.isArray(saved[k]))
      if (ok) return { ...seed(), ...saved }
    }
  } catch {
    /* storage unavailable: fall back to seed */
  }
  return seed()
}

interface Store extends DemoState {
  toasts: Toast[]
  addAsset: (a: Asset) => void
  updateAsset: (id: string, patch: Partial<Asset>) => void
  setBlocks: (fn: (b: Block[]) => Block[]) => void
  addRule: (r: Rule) => void
  addToRotation: (ids: string[]) => void
  toast: (message: string, link?: Toast['link']) => void
  dismissToast: (id: string) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(load)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota or private mode: demo still works in memory */
    }
  }, [state])

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (message: string, link?: Toast['link']) => {
      const id = uid('t')
      setToasts((t) => [...t.slice(-2), { id, message, link }])
      setTimeout(() => dismissToast(id), 6000)
    },
    [dismissToast],
  )

  const store = useMemo<Store>(
    () => ({
      ...state,
      toasts,
      addAsset: (a) => setState((s) => ({ ...s, assets: [a, ...s.assets] })),
      updateAsset: (id, patch) => setState((s) => ({ ...s, assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      setBlocks: (fn) => setState((s) => ({ ...s, blocks: fn(s.blocks) })),
      addRule: (r) => setState((s) => ({ ...s, rules: [...s.rules, r] })),
      addToRotation: (ids) => setState((s) => ({ ...s, rotation: [...s.rotation, ...ids.filter((i) => !s.rotation.includes(i))] })),
      toast,
      dismissToast,
      reset: () => {
        try {
          localStorage.removeItem(KEY)
          Object.keys(sessionStorage).filter((k) => k.startsWith('draft:')).forEach((k) => sessionStorage.removeItem(k))
        } catch {
          /* ignore */
        }
        setState(seed())
        setToasts([])
      },
    }),
    [state, toasts, toast, dismissToast],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside provider')
  return s
}

/** Flow drafts survive a reload (so every step URL works) but not a new tab */
export function useDraft<T>(key: string, initial: T): [T, (patch: Partial<T>) => void, () => void] {
  const [draft, setDraft] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(`draft:${key}`)
      if (raw) return { ...initial, ...JSON.parse(raw) }
    } catch {
      /* ignore */
    }
    return initial
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(`draft:${key}`, JSON.stringify(draft))
    } catch {
      /* ignore */
    }
  }, [key, draft])
  const update = useCallback((patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch })), [])
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(`draft:${key}`)
    } catch {
      /* ignore */
    }
    setDraft(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return [draft, update, clear]
}
