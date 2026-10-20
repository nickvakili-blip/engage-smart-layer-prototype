import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

const STORAGE_KEY = 'engage-smart-demo-v1'

/** Shows what broke instead of a blank page, with a way out. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Prototype page crashed:', error, info.componentStack)
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">This page hit a problem</h1>
        <p className="mt-2 text-gray-600">Please share the message below with the prototype owner.</p>
        <pre className="mt-6 whitespace-pre-wrap break-words rounded-lg bg-gray-100 p-4 text-left text-xs text-red-700">
          {error.name}: {error.message}
          {'\n'}
          {navigator.userAgent}
        </pre>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-outline" onClick={() => window.location.reload()}>Reload page</button>
          <button
            className="btn-primary"
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY)
                sessionStorage.clear()
              } catch {
                /* ignore */
              }
              window.location.assign('/smart')
            }}
          >
            Reset demo and go home
          </button>
        </div>
      </div>
    )
  }
}
