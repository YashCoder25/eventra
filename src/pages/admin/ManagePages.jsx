import { useMemo, useState } from 'react'
import { useDB } from '../../lib/db'
import { formatDateTime, money, shortDate, todayISO } from '../../lib/util'
import { Badge, Empty, Field, Modal, Toggle, statusTone } from '../../components/ui'

const Stat = ({ icon, label, value, sub, tone }) => (
  <div className={`stat ${tone || ''}`}>
    <span className="stat-icon" aria-hidden="true">{icon}</span>
    <div><strong>{value}</strong><span>{label}</span>{sub && <small>{sub}</small>}</div>
  </div>
)

/* ================= Dashboard ================= */
export function Dashboard() {
  const { db, admin, event, pass, userById } = useDB()

  const s = useMemo(() => {
    const live = db.bookings.filter((b) => b.status !== 'cancelled')
    const confirmed = db.bookings.filter((b) => b.status === 'confirmed')
    const weekAgo = Date.now() - 7 * 86400000
    const activeUsers = new Set(db.loginLogs.filter((l) => l.role === 'user' && Date.parse(l.at) >= weekAgo).map((l) => l.userId))
    const today = new Date().toDateString()
    const perEvent = db.events
      .map((e) => ({
        e,
        seats: live.filter((b) => b.eventId === e.id).reduce((n, b) => n + b.qty, 0),
        bookings: live.filter((b) => b.eventId === e.id).length,
      }))
      .filter((x) => x.seats > 0)
      .sort((a, b) => b.seats - a.seats)
      .slice(0, 8)
    return {
      revenue: confirmed.reduce((n, b) => n + b.total, 0),
      pending: db.bookings.filter((b) => b.status === 'pending').length,
      seats: live.reduce((n, b) => n + b.qty, 0),
      activeUsers: activeUsers.size,
      loginsToday: db.loginLogs.filter((l) => new Date(l.at).toDateString() === today).length,
      newQueries: db.queries.filter((q) => q.status === 'new').length,
      perEvent,
      maxSeats: Math.max(1, ...perEvent.map((x) => x.seats)),
      byCat: db.categories.map((c) => ({
        c,
        n: live.filter((b) => event(b.eventId)?.categoryId === c.id).reduce((n, b) => n + b.qty, 0),
      })),
    }
  }, [db, event])

  const recent = [...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
  const maxCat = Math.max(1, ...s.byCat.map((x) => x.n))

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {admin?.name || 'Admin'} 👋</h1>
          <p className="muted">Here’s what’s happening on Eventra today.</p>
        </div>
      </div>

      <div className="stats">
        <Stat icon="🎫" label="Total events" value={db.events.length} sub={`${db.events.filter((e) => e.active).length} active`} />
        <Stat icon="📖" label="Bookings" value={db.bookings.length} sub={`${s.pending} pending`} tone="amber" />
        <Stat icon="💰" label="Confirmed revenue" value={money(s.revenue)} tone="green" />
        <Stat icon="🪑" label="Seats booked" value={s.seats} />
        <Stat icon="👥" label="Registered users" value={db.users.length} sub={`${s.activeUsers} active this week`} />
        <Stat icon="🔑" label="Logins today" value={s.loginsToday} />
        <Stat icon="✉️" label="New queries" value={s.newQueries} tone={s.newQueries ? 'amber' : ''} />
        <Stat icon="🗂️" label="Categories" value={db.categories.length} />
      </div>

      <div className="two-col">
        <section className="panel">
          <h3>Registrations per event <small>(top 8, seats booked)</small></h3>
          {s.perEvent.length === 0 ? <Empty>No bookings yet.</Empty> : (
            <div className="bars">
              {s.perEvent.map(({ e, seats }) => (
                <div className="bar-row" key={e.id}>
                  <span className="bar-label" title={e.title}>{e.title}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(seats / s.maxSeats) * 100}%` }} /></div>
                  <b>{seats}</b>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <h3>Participation by category <small>(seats)</small></h3>
          <div className="bars">
            {s.byCat.map(({ c, n }) => (
              <div className="bar-row" key={c.id}>
                <span className="bar-label">{c.icon} {c.name}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / maxCat) * 100}%`, background: c.color }} /></div>
                <b>{n}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h3>Recent bookings</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ref</th><th>Event</th><th>User</th><th>Pass</th><th>Total</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td><code>{b.ref}</code></td>
                  <td>{event(b.eventId)?.title || '—'}</td>
                  <td>{userById(b.userId)?.name || '—'}</td>
                  <td>{pass(b.passId)?.name} × {b.qty}</td>
                  <td>{money(b.total)}</td>
                  <td><Badge tone={statusTone[b.status]}>{b.status}</Badge></td>
                  <td>{formatDateTime(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

/* ================= Categories ================= */
const blankCat = { name: '', icon: '🎫', color: '#6366f1', description: '', active: true }

export function Categories() {
  const { db, add, edit, remove } = useDB()
  const [form, setForm] = useState(null)

  const save = (e) => {
    e.preventDefault()
    const data = { ...form, name: form.name.trim() }
    if (db.categories.some((c) => c.id !== form.id && c.name.toLowerCase() === data.name.toLowerCase())) return alert('A category with this name already exists.')
    form.id ? edit('categories', form.id, data) : add('categories', data)
    setForm(null)
  }
  const del = (c) => {
    const used = db.events.filter((e) => e.categoryId === c.id).length
    if (used) return alert(`"${c.name}" is used by ${used} event(s). Reassign or delete those events first, or mark the category inactive.`)
    if (window.confirm(`Delete category "${c.name}"?`)) remove('categories', c.id)
  }

  return (
    <>
      <div className="page-head">
        <h1>Event categories</h1>
        <button className="btn primary" onClick={() => setForm({ ...blankCat })}>+ Add category</button>
      </div>
      <div className="table-wrap panel">
        <table>
          <thead><tr><th></th><th>Name</th><th>Description</th><th>Events</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {db.categories.map((c) => (
              <tr key={c.id}>
                <td><span className="dot" style={{ background: c.color }}>{c.icon}</span></td>
                <td><strong>{c.name}</strong></td>
                <td className="muted">{c.description}</td>
                <td>{db.events.filter((e) => e.categoryId === c.id).length}</td>
                <td><Toggle checked={c.active} onChange={(v) => edit('categories', c.id, { active: v })} label={`Toggle ${c.name}`} /></td>
                <td className="row-actions">
                  <button className="btn sm" onClick={() => setForm({ ...c })}>Edit</button>
                  <button className="btn sm danger" onClick={() => del(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form && (
        <Modal title={form.id ? 'Edit category' : 'Add category'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Field label="Name"><input required maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <div className="two">
              <Field label="Icon (emoji)"><input required maxLength={4} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></Field>
              <Field label="Colour"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
            </div>
            <Field label="Description"><input maxLength={120} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active (visible to users)</label>
            <div className="row-end"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary">Save</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}

/* ================= Events ================= */
const blankEvent = (catId) => ({ title: '', categoryId: catId, city: '', venue: '', date: todayISO(), time: '19:00', basePrice: 499, capacity: 500, description: '', active: true })

export function Events() {
  const { db, add, edit, remove, taken, category } = useDB()
  const [form, setForm] = useState(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')

  const list = db.events
    .filter((e) => (cat === 'all' || e.categoryId === cat) && (status === 'all' || (status === 'active') === e.active) && (!q || `${e.title} ${e.city}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.date.localeCompare(b.date))

  const save = (e) => {
    e.preventDefault()
    const data = { ...form, basePrice: Number(form.basePrice), capacity: Number(form.capacity), title: form.title.trim() }
    if (data.id && data.capacity < taken(data.id)) return alert(`Capacity cannot be below seats already booked (${taken(data.id)}).`)
    form.id ? edit('events', form.id, data) : add('events', data)
    setForm(null)
  }
  const del = (ev) => {
    const n = db.bookings.filter((b) => b.eventId === ev.id).length
    if (window.confirm(`Delete "${ev.title}"${n ? ` and its ${n} booking(s)` : ''}? This cannot be undone.`)) remove('events', ev.id)
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <div className="page-head">
        <h1>Events <small>({list.length})</small></h1>
        <button className="btn primary" onClick={() => setForm(blankEvent(db.categories[0]?.id))}>+ Add event</button>
      </div>
      <div className="filters bar">
        <input placeholder="Search title or city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="all">All categories</option>
          {db.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="table-wrap panel">
        <table>
          <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>City</th><th>Base price</th><th>Seats</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {list.map((ev) => (
              <tr key={ev.id} className={ev.active ? '' : 'dim'}>
                <td><strong>{ev.title}</strong><br /><small className="muted">{ev.venue}</small></td>
                <td>{category(ev.categoryId)?.icon} {category(ev.categoryId)?.name || '—'}</td>
                <td>{shortDate(ev.date)}<br /><small className="muted">{ev.time}</small></td>
                <td>{ev.city}</td>
                <td>{money(ev.basePrice)}</td>
                <td>{taken(ev.id)} / {ev.capacity}</td>
                <td><Toggle checked={ev.active} onChange={(v) => edit('events', ev.id, { active: v })} label={`Toggle ${ev.title}`} /></td>
                <td className="row-actions">
                  <button className="btn sm" onClick={() => setForm({ ...ev })}>Edit</button>
                  <button className="btn sm danger" onClick={() => del(ev)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty>No events found.</Empty>}
      </div>
      {form && (
        <Modal title={form.id ? 'Edit event' : 'Add event'} onClose={() => setForm(null)} wide>
          <form onSubmit={save}>
            <Field label="Title"><input required maxLength={100} value={form.title} onChange={set('title')} /></Field>
            <div className="two">
              <Field label="Category">
                <select required value={form.categoryId} onChange={set('categoryId')}>
                  {db.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="City"><input required value={form.city} onChange={set('city')} /></Field>
            </div>
            <Field label="Venue"><input required value={form.venue} onChange={set('venue')} /></Field>
            <div className="two">
              <Field label="Date"><input type="date" required value={form.date} onChange={set('date')} /></Field>
              <Field label="Time"><input type="time" required value={form.time} onChange={set('time')} /></Field>
            </div>
            <div className="two">
              <Field label="Base price (₹, Normal pass)"><input type="number" min="0" required value={form.basePrice} onChange={set('basePrice')} /></Field>
              <Field label="Total capacity"><input type="number" min="1" required value={form.capacity} onChange={set('capacity')} /></Field>
            </div>
            <Field label="Description"><textarea rows={3} maxLength={500} value={form.description} onChange={set('description')} /></Field>
            <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active (open for booking)</label>
            <div className="row-end"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary">Save event</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}

/* ================= Pass categories ================= */
const blankPass = { name: '', multiplier: 1, perks: '', active: true }

export function Passes() {
  const { db, add, edit, remove } = useDB()
  const [form, setForm] = useState(null)

  const save = (e) => {
    e.preventDefault()
    const data = { ...form, name: form.name.trim(), multiplier: Number(form.multiplier) }
    if (db.passes.some((p) => p.id !== form.id && p.name.toLowerCase() === data.name.toLowerCase())) return alert('A pass with this name already exists.')
    form.id ? edit('passes', form.id, data) : add('passes', data)
    setForm(null)
  }
  const del = (p) => {
    const used = db.bookings.filter((b) => b.passId === p.id).length
    if (used) return alert(`"${p.name}" has ${used} booking(s) and cannot be deleted. Mark it inactive instead.`)
    if (window.confirm(`Delete pass "${p.name}"?`)) remove('passes', p.id)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pass categories</h1>
          <p className="muted">Ticket price = event base price × pass multiplier.</p>
        </div>
        <button className="btn primary" onClick={() => setForm({ ...blankPass })}>+ Add pass</button>
      </div>
      <div className="table-wrap panel">
        <table>
          <thead><tr><th>Pass</th><th>Multiplier</th><th>Perks</th><th>Bookings</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {db.passes.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>× {p.multiplier}</td>
                <td className="muted">{p.perks}</td>
                <td>{db.bookings.filter((b) => b.passId === p.id).length}</td>
                <td><Toggle checked={p.active} onChange={(v) => edit('passes', p.id, { active: v })} label={`Toggle ${p.name}`} /></td>
                <td className="row-actions">
                  <button className="btn sm" onClick={() => setForm({ ...p })}>Edit</button>
                  <button className="btn sm danger" onClick={() => del(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form && (
        <Modal title={form.id ? 'Edit pass' : 'Add pass'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Field label="Name"><input required maxLength={30} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Price multiplier" hint="1 = base price, 2.5 = 2.5× base price"><input type="number" step="0.1" min="0.1" required value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} /></Field>
            <Field label="Perks"><textarea rows={2} maxLength={200} value={form.perks} onChange={(e) => setForm({ ...form, perks: e.target.value })} /></Field>
            <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <div className="row-end"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary">Save</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
