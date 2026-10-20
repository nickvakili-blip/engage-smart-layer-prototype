import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useStore } from '../../state/store'
import { readAndResize } from '../../data/images'
import { uid } from '../../lib/time'
import { AssetPreview } from '../../ui/ScreenPreview'
import { Icon } from '../../ui/Icon'
import type { Brain, ChatAction, ChatInput, ChatMessage } from './chatBrains'

const storageKey = (key: string) => `draft:chat-${key}`

export function clearChat(key: string) {
  try {
    sessionStorage.removeItem(storageKey(key))
  } catch {
    /* ignore */
  }
}

function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(storageKey(key))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return []
}

function Mark() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink" aria-hidden>
      <svg viewBox="0 0 48 36" className="h-3.5">
        <path d="M2 2h30l-6 7H8zM10 13h30l-6 7H16zM2 24h30l-6 7H8z" fill="#5fd0a6" />
      </svg>
    </span>
  )
}

interface Props<S> {
  chatKey: string
  brain: Brain<S>
  slots: S
  onPatch: (patch: Partial<S>) => void
  onDone: (step: string, slots: S) => void
  examples: string[]
  placeholder: string
  /** file types the paperclip accepts; omit to hide it */
  accept?: string
}

/** "Describe it, we build it": a scoped chat that fills one Create flow. */
export function CreateChat<S>({ chatKey, brain, slots, onPatch, onDone, examples, placeholder, accept }: Props<S>) {
  const { assets } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(chatKey))
  const [text, setText] = useState('')
  const [typing, setTyping] = useState<string | null>(null)
  const slotsRef = useRef(slots)
  slotsRef.current = slots
  const listRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  // the greeting reflects whatever the draft already holds when the chat opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const greeting = useMemo<ChatMessage>(() => ({ id: 'greeting', from: 'bot', ...brain.greet(slots) }), [])

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey(chatKey), JSON.stringify(messages))
    } catch {
      /* quota: keep the chat in memory only */
    }
  }, [chatKey, messages])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const add = (m: Omit<ChatMessage, 'id'>) => setMessages((ms) => [...ms, { ...m, id: uid('m') }])

  const run = (input: ChatInput, echo: Omit<ChatMessage, 'id' | 'from'>) => {
    if (typing !== null) return
    add({ from: 'user', ...echo })
    const res = brain.respond(input, slotsRef.current, { assets })
    const finish = () => {
      setTyping(null)
      if (Object.keys(res.patch).length) onPatch(res.patch)
      if (res.reply) add({ from: 'bot', ...res.reply })
      if (res.done) onDone(res.done, { ...slotsRef.current, ...res.patch })
    }
    if (res.done && !res.reply) {
      timers.current.push(window.setTimeout(finish, 250))
      return
    }
    setTyping(res.typing ?? '')
    timers.current.push(window.setTimeout(finish, res.delay ?? 650))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setText('')
    run({ text: t }, { text: t })
  }

  const act = (a: ChatAction) => {
    if (a.id === 'camera') return camRef.current?.click()
    if (a.id === 'upload') return fileRef.current?.click()
    run({ action: a.id }, { text: a.label })
  }

  const pick = async (file?: File) => {
    if (!file) return
    const pdf = file.type === 'application/pdf'
    const src = pdf ? '' : await readAndResize(file)
    run({ file: { src, name: file.name, pdf } }, pdf ? { text: `PDF: ${file.name}` } : { text: '', image: src })
  }

  const lastBot = messages.map((m) => m.from).lastIndexOf('bot')
  const fileAccept = accept ?? 'image/*'

  return (
    <section className="card mb-2 overflow-hidden" aria-label="Tell us what you want to make">
      <div className="flex items-center gap-3 px-4 py-3">
        <Mark />
        <div className="min-w-0">
          <div className="font-bold">Tell us what you want to make</div>
          <div className="text-sm text-gray-600">{greeting.text}</div>
        </div>
        {messages.length > 0 && (
          <button className="ml-auto shrink-0 text-xs font-semibold text-gray-500 hover:text-ink" onClick={() => { timers.current.forEach(clearTimeout); setTyping(null); setMessages([]) }}>
            Clear chat
          </button>
        )}
      </div>

      {(messages.length > 0 || typing !== null) && (
      <div ref={listRef} className="max-h-[380px] space-y-3 overflow-y-auto border-t bg-gray-50 p-4" aria-live="polite">
        {messages.map((m, i) =>
          m.from === 'bot' ? (
            <div key={m.id} className="animate-slideup flex items-start gap-2">
              <Mark />
              <div className="min-w-0 max-w-[90%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-3.5 py-2.5 text-[15px] shadow-card">
                <p>{m.text}</p>
                {m.preview && <div className="mt-2.5 w-full max-w-sm"><AssetPreview asset={m.preview} spotlights={assets} /></div>}
                {m.actions && i === lastBot && typing === null && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.actions.map((a) => (
                      <button key={a.id} onClick={() => act(a)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${a.primary ? 'border-ink bg-ink text-white hover:bg-black/80' : 'border-gray-300 bg-white hover:border-pine hover:text-pine'}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="animate-slideup flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-pine px-3.5 py-2.5 text-[15px] text-white">
                {m.image && <img src={m.image} alt="Your photo" className="mb-1 max-h-40 rounded-lg" />}
                {m.text && <p>{m.text}</p>}
              </div>
            </div>
          ),
        )}
        {typing !== null && (
          <div className="flex items-center gap-2">
            <Mark />
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-3.5 py-3">
              {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${d}ms` }} />)}
              {typing && <span className="ml-1 text-sm text-gray-600">{typing}</span>}
            </div>
          </div>
        )}
      </div>
      )}

      {messages.length === 0 && typing === null && (
        <div className="flex flex-wrap gap-2 border-t px-4 py-3">
          {greeting.actions?.map((a) => (
            <button key={a.id} onClick={() => act(a)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${a.primary ? 'border-ink bg-ink text-white hover:bg-black/80' : 'border-gray-300 bg-white hover:border-pine hover:text-pine'}`}>
              {a.label}
            </button>
          ))}
          {examples.map((ex) => (
            <button key={ex} onClick={() => run({ text: ex }, { text: ex })} className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-left text-sm text-gray-700 hover:border-pine hover:text-pine">
              “{ex}”
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
        {accept !== undefined && (
          <>
            <input ref={fileRef} type="file" accept={fileAccept} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-gray-600 hover:bg-gray-100" aria-label="Attach a file">
              <Icon name="paperclip" />
            </button>
          </>
        )}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="field min-w-0 flex-1" aria-label="Message" />
        <button className="btn-primary h-11 w-11 shrink-0 px-0" disabled={!text.trim() || typing !== null} aria-label="Send">
          <Icon name="send" className="h-5 w-5" />
        </button>
      </form>
    </section>
  )
}

export function StepByStepDivider() {
  return (
    <div className="my-8 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-400">
      <span className="h-px flex-1 bg-gray-200" />
      or do it step by step
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  )
}
