'use client'

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-8">
          <div className="max-w-md w-full bg-[var(--color-bg-card)] border border-[rgba(255,107,107,0.3)] rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold text-[var(--color-coral)] mb-2">Klaida</p>
            <p className="text-xs text-[var(--color-text-muted)] font-mono break-all">
              {this.state.error.message}
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
