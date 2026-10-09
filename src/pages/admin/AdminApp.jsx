import { useState } from 'react'
import { useDB } from '../../lib/db'
import { navigate } from '../../lib/util'
import { Field } from '../../components/ui'
import { Dashboard, Categories, Events, Passes } from './ManagePages'
import { Bookings, Users, Queries, Reports } from './OpsPages'

const NAV = [
  ['dashboard', '📊', 'Dashboard'],
  ['categories', '🗂️', 'Categories'],
  ['events', '🎫', 'Events'],
  ['passes', '🏷️', 'Pass categories'],
  ['bookings', '📖', 'Bookings'],
  ['users', '👥', 'Users & logins'],
  ['queries', '✉️', 'Queries'],
  ['reports', '📈', 'Reports'],
]
const PAGES = { dashboard: Dashboard, categories: Categories, events: Events, passes: Passes, bookings: Bookings, users: Users, queries: Queries, reports: Reports }

function AdminLogin() {
  const { loginAdmin } = useDB()
  const [f, setF] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')
  const [fails, setFails] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)

  const submit = (e) => {
    e.preventDefault()
    if (Date.now() < lockUntil) return setErr(`Too many attempts. Try again in ${Math.ceil((lockUntil - Date.now()) / 1000)}s.`)
    const res = loginAdmin(f.username, f.password)
    if (res.error) {
      const n = fails + 1
      setFails(n)
      if (n >= 5) {
        setLockUntil(Date.now() + 30000)
        setFails(0)
        return setErr('Too many failed attempts. Locked for 30 seconds.')
      }
      return setErr(res.error)
    }
    navigate('/admin/dashboard')
  }
  return (
    <div className="admin-login">
      <form className="card pad auth" onSubmit={submit}>
        <div className="brand-lg">🎟️ Eventra <span>Admin</span></div>
        <p className="hint">Sign in to manage events, bookings and reports.</p>
        <Field label="Username"><input required autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
        <Field label="Password"><input type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary block">Sign in</button>
        <p className="hint demo">Demo: <code>admin</code> / <code>admin123</code></p>
        <a href="#/" className="alt">← Back to site</a>
      </form>
    </div>
  )
}

export default function AdminApp({ route }) {
  const { admin, logoutAdmin, reset } = useDB()
  const [menu, setMenu] = useState(false)
  if (!admin) return <AdminLogin />

  const page = route.replace(/^\/admin\/?/, '').split('?')[0] || 'dashboard'
  const Page = PAGES[page] || Dashboard
  const logout = () => {
    logoutAdmin()
    navigate('/admin')
  }

  return (
    <div className="admin">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand-lg">🎟️ Eventra <span>Admin</span></div>
        <nav>
          {NAV.map(([k, icon, label]) => (
            <a key={k} href={`#/admin/${k}`} className={page === k ? 'active' : ''} onClick={() => setMenu(false)}>{icon} {label}</a>
          ))}
        </nav>
        <div className="side-foot">
          <a href="#/">🌐 View site</a>
          <button onClick={() => window.confirm('Reset ALL data back to the original db.json (50 events)? Your changes will be lost.') && reset()}>♻️ Reset demo data</button>
          <button onClick={logout}>🚪 Logout</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <button className="icon-btn menu-btn" onClick={() => setMenu((m) => !m)} aria-label="Toggle menu">☰</button>
          <span>Signed in as <b>{admin.name}</b></span>
          <button className="btn sm" onClick={logout}>Logout</button>
        </header>
        <div className="admin-content"><Page /></div>
      </div>
    </div>
  )
}
