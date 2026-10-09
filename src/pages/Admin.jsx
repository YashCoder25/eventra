import { useState } from 'react'
import { ADMIN_PASS, ADMIN_USER, formatDate } from '../lib/store'

const emptyEvent = {
  title: '',
  date: '',
  time: '',
  location: '',
  description: '',
  capacity: 50,
}

function Login({ auth }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!auth.login(user, pass)) setError('Wrong username or password')
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h2>Admin login</h2>
      <label>
        Username
        <input value={user} onChange={(e) => setUser(e.target.value)} autoFocus />
      </label>
      <label>
        Password
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
      </label>
      {error && <span className="error">{error}</span>}
      <button className="btn" type="submit">Login</button>
      <p className="muted small">Demo: {ADMIN_USER} / {ADMIN_PASS}</p>
    </form>
  )
}

function EventForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.title.trim()) err.title = 'Title required'
    if (!form.date) err.date = 'Date required'
    if (!form.location.trim()) err.location = 'Location required'
    if (!(Number(form.capacity) >= 1)) err.capacity = 'Capacity must be 1 or more'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      capacity: Number(form.capacity),
    })
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h3>{initial.id ? 'Edit event' : 'New event'}</h3>
      <label>
        Title
        <input value={form.title} onChange={set('title')} />
        {errors.title && <span className="error">{errors.title}</span>}
      </label>
      <div className="row">
        <label className="grow">
          Date
          <input type="date" value={form.date} onChange={set('date')} />
          {errors.date && <span className="error">{errors.date}</span>}
        </label>
        <label className="grow">
          Time
          <input type="time" value={form.time} onChange={set('time')} />
        </label>
      </div>
      <label>
        Location
        <input value={form.location} onChange={set('location')} />
        {errors.location && <span className="error">{errors.location}</span>}
      </label>
      <label>
        Capacity
        <input type="number" min="1" value={form.capacity} onChange={set('capacity')} />
        {errors.capacity && <span className="error">{errors.capacity}</span>}
      </label>
      <label>
        Description
        <textarea rows="3" value={form.description} onChange={set('description')} />
      </label>
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn">Save</button>
      </div>
    </form>
  )
}

function EventsTab({ store }) {
  const [editing, setEditing] = useState(null) // null | event object | emptyEvent

  const save = (data) => {
    if (data.id) store.updateEvent(data.id, data)
    else store.addEvent(data)
    setEditing(null)
  }

  const remove = (ev) => {
    if (window.confirm(`Delete "${ev.title}" and its registrations?`)) store.deleteEvent(ev.id)
  }

  if (editing) {
    return <EventForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />
  }

  return (
    <>
      <div className="row">
        <h2>Events ({store.events.length})</h2>
        <button className="btn" onClick={() => setEditing(emptyEvent)}>+ Add event</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>When</th>
              <th>Location</th>
              <th>Booked</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {store.events.length === 0 && (
              <tr><td colSpan="5" className="muted">No events yet.</td></tr>
            )}
            {store.events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.title}</td>
                <td>{formatDate(ev.date, ev.time)}</td>
                <td>{ev.location}</td>
                <td>{store.seatsTaken(ev.id)} / {ev.capacity}</td>
                <td className="actions">
                  <button className="btn small ghost" onClick={() => setEditing(ev)}>Edit</button>
                  <button className="btn small danger" onClick={() => remove(ev)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function RegistrationsTab({ store }) {
  const [filter, setFilter] = useState('all')
  const title = (id) => store.events.find((e) => e.id === id)?.title ?? 'Deleted event'

  const rows = store.registrations
    .filter((r) => filter === 'all' || r.eventId === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [
      ['Event', 'Name', 'Email', 'Phone', 'Seats', 'Registered at'].map(esc).join(','),
      ...rows.map((r) =>
        [title(r.eventId), r.name, r.email, r.phone, r.seats, r.createdAt].map(esc).join(','),
      ),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'registrations.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="row">
        <h2>Registrations ({rows.length})</h2>
        <div className="row">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All events</option>
            {store.events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <button className="btn ghost" onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Seats</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="6" className="muted">No registrations.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{title(r.eventId)}</td>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.phone || '-'}</td>
                <td>{r.seats}</td>
                <td className="actions">
                  <button
                    className="btn small danger"
                    onClick={() => window.confirm('Remove registration?') && store.deleteRegistration(r.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function Admin({ store, auth }) {
  const [tab, setTab] = useState('events')

  if (!auth.authed) return <Login auth={auth} />

  const totalSeats = store.registrations.reduce((s, r) => s + Number(r.seats || 1), 0)

  return (
    <>
      <div className="page-head">
        <h1>Admin panel</h1>
        <button className="btn ghost" onClick={auth.logout}>Logout</button>
      </div>

      <div className="stats">
        <div className="card stat"><b>{store.events.length}</b><span>Events</span></div>
        <div className="card stat"><b>{store.registrations.length}</b><span>Registrations</span></div>
        <div className="card stat"><b>{totalSeats}</b><span>Seats booked</span></div>
      </div>

      <div className="tabs">
        <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>
          Events
        </button>
        <button className={tab === 'regs' ? 'active' : ''} onClick={() => setTab('regs')}>
          Registrations
        </button>
      </div>

      {tab === 'events' ? <EventsTab store={store} /> : <RegistrationsTab store={store} />}
    </>
  )
}
