'use client'

import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-green)',
              secondary: 'var(--color-bg-card)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-coral)',
              secondary: 'var(--color-bg-card)',
            },
          },
        }}
      />
    </>
  )
}
