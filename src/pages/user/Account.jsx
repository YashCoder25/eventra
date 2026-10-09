import { useEffect, useState } from 'react'
import { useDB } from '../../lib/db'
import { formatDateTime, navigate, queryParams, money } from '../../lib/util'
import { Badge, Empty, Field, Modal, Ticket, statusTone } from '../../components/ui'

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/profile')

/* ---------- Login ---------- */
export function Login({ route }) {
  const { loginUser } = useDB()
  const next = safeNext(queryParams(route).next)
  const [f, setF] = useState({ email: '', password: '', remember: true })
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const res = loginUser(f.email, f.password, f.remember)
    if (res.error) return setErr(res.error)
    navigate(next)
  }
  return (
    <div className="container section narrow">
      <form className="card pad auth" onSubmit={submit}>
        <h2>Welcome back</h2>
        <p className="hint">Log in to book events and see your tickets.</p>
        <Field label="Email"><input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <label className="check"><input type="checkbox" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} /> Keep me logged in for 7 days</label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary block">Log in</button>
        <p className="alt">New here? <a href={`#/register?next=${encodeURIComponent(next)}`}>Create an account</a></p>
        <p className="hint demo">Demo: <code>user@eventra.com</code> / <code>user123</code></p>
      </form>
    </div>
  )
}

/* ---------- Register ---------- */
export function Register({ route }) {
  const { registerUser } = useDB()
  const next = safeNext(queryParams(route).next)
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.')
    if (f.password !== f.confirm) return setErr('Passwords do not match.')
    if (!/^[0-9+\-\s]{7,15}$/.test(f.phone)) return setErr('Enter a valid phone number.')
    const res = registerUser(f)
    if (res.error) return setErr(res.error)
    navigate(next)
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="container section narrow">
      <form className="card pad auth" onSubmit={submit}>
        <h2>Create your account</h2>
        <Field label="Full name"><input required value={f.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email"><input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Phone"><input type="tel" required value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        <Field label="Password" hint="At least 6 characters"><input type="password" required value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Confirm password"><input type="password" required value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary block">Register</button>
        <p className="alt">Already registered? <a href={`#/login?next=${encodeURIComponent(next)}`}>Log in</a></p>
      </form>
    </div>
  )
}

/* ---------- Profile & my bookings ---------- */
export function Profile() {
  const { db, user, event, pass, setBookingStatus } = useDB()
  const [open, setOpen] = useState(null)
  useEffect(() => {
    if (!user) navigate(`/login?next=${encodeURIComponent('/profile')}`)
  }, [user])
  if (!user) return null
  const mine = db.bookings.filter((b) => b.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const spent = mine.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.total, 0)

  return (
    <div className="container section">
      <div className="profile-head card pad">
        <div className="avatar" aria-hidden="true">{user.name[0]?.toUpperCase()}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="meta">{user.email} · {user.phone}</p>
          <p className="meta">Member since {formatDateTime(user.createdAt).split(',')[0]}</p>
        </div>
        <div className="mini-stats">
          <div><strong>{mine.length}</strong><span>Bookings</span></div>
          <div><strong>{money(spent)}</strong><span>Confirmed spend</span></div>
        </div>
      </div>

      <h3 className="mt">My bookings</h3>
      {mine.length === 0 ? (
        <Empty>You haven’t booked anything yet. <a href="#/">Find an event</a></Empty>
      ) : (
        <div className="booking-list">
          {mine.map((b) => {
            const ev = event(b.eventId)
            return (
              <div className="card booking-item" key={b.id}>
                <div>
                  <strong>{ev?.title || 'Deleted event'}</strong>
                  <p className="meta">{ev && `${ev.date} · ${ev.city}`} · {pass(b.passId)?.name} × {b.qty} · {money(b.total)}</p>
                  <p className="meta"><code>{b.ref}</code></p>
                </div>
                <div className="actions">
                  <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                  <button className="btn sm" onClick={() => setOpen(b)}>View ticket</button>
                  {b.status === 'pending' && (
                    <button className="btn sm danger" onClick={() => window.confirm('Cancel this booking?') && setBookingStatus(b.id, 'cancelled')}>Cancel</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {open && (
        <Modal title="Your ticket" onClose={() => setOpen(null)} wide>
          <Ticket booking={db.bookings.find((x) => x.id === open.id) || open} />
        </Modal>
      )}
    </div>
  )
}

/* ---------- About ---------- */
export function About() {
  return (
    <div className="container section narrow">
      <h1>About Eventra</h1>
      <p className="lead">Eventra makes it simple to discover live experiences and book them in seconds.</p>
      <div className="grid three">
        <div className="card pad"><h3>🎟️ Easy booking</h3><p>Pick an event, choose Normal, VIP or VVIP and confirm in three quick steps.</p></div>
        <div className="card pad"><h3>📱 QR entry</h3><p>Every booking gets a unique QR code that organisers scan at the gate – no paper needed.</p></div>
        <div className="card pad"><h3>🎶 Every vibe</h3><p>Concerts, festivals, DJ nights, cultural shows, sports, comedy and workshops in one place.</p></div>
      </div>
      <h3 className="mt">Our story</h3>
      <p>Eventra started with a simple idea: finding and booking a great night out should be as enjoyable as the event itself. We work with organisers and venues across India to bring you verified listings, transparent pricing and instant tickets.</p>
    </div>
  )
}

/* ---------- Contact ---------- */
export function Contact() {
  const { user, submitQuery } = useDB()
  const [f, setF] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    submitQuery({ ...f, name: f.name.trim(), subject: f.subject.trim(), message: f.message.trim() })
    setSent(true)
  }
  return (
    <div className="container section narrow">
      <h1>Contact us</h1>
      <p className="lead">Questions about a booking or an event? Send us a message and we’ll get back to you.</p>
      {sent ? (
        <div className="card pad center">
          <h3>✅ Message sent</h3>
          <p>Thanks! Our team will reply to {f.email} soon.</p>
          <button className="btn" onClick={() => { setSent(false); setF({ ...f, subject: '', message: '' }) }}>Send another</button>
        </div>
      ) : (
        <form className="card pad" onSubmit={submit}>
          <div className="two">
            <Field label="Your name"><input required maxLength={80} value={f.name} onChange={set('name')} /></Field>
            <Field label="Email"><input type="email" required value={f.email} onChange={set('email')} /></Field>
          </div>
          <Field label="Subject"><input required maxLength={120} value={f.subject} onChange={set('subject')} /></Field>
          <Field label="Message"><textarea required rows={5} maxLength={1500} value={f.message} onChange={set('message')} /></Field>
          <button className="btn primary">Send message</button>
        </form>
      )}
    </div>
  )
}
