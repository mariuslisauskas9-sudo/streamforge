export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f',
      fontFamily: 'sans-serif', color: 'white',
    }}>
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>StreamForge</h1>
        <p style={{ margin: '0 0 16px', color: '#9898b0', fontSize: 14 }}>Creator management platform</p>

        <form method="POST" action="/api/login" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#111', color: 'white', fontSize: 14, outline: 'none' }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#111', color: 'white', fontSize: 14, outline: 'none' }}
          />

          {error && (
            <p style={{ margin: 0, padding: '8px 12px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 }}>
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#7c6aff', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
