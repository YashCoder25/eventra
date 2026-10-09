import { useState } from 'react'
import { formatDate } from '../lib/store'

const emptyForm = { name: '', email: '', phone: '', seats: 1 }

function RegisterForm({ event, store, onClose }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)

  const left = Math.max(0, Number(event.capacity) - store.seatsTaken(event.id))

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Name required'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Valid email required'
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) err.phone = 'Invalid phone'
    const seats = Number(form.seats)
    if (!Number.isInteger(seats) || seats < 1) err.seats = 'At least 1 seat'
    else if (seats > left) err.seats = `Only ${left} seat(s) left`
    return err
  }

  const submit = (e) => {
    e.preventDefault()
    const err = validate()
    setErrors(err)
    if (Object.keys(err).length) return
    store.addRegistration({
      eventId: event.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      seats: Number(form.seats),
    })
    setDone(true)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{event.title}</h2>
        <p className="muted">{formatDate(event.date, event.time)} · {event.location}</p>
        {done ? (
          <>
            <p className="success">You are registered. See you there!</p>
            <button className="btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <label>
              Name
              <input value={form.name} onChange={set('name')} />
              {errors.name && <span className="error">{errors.name}</span>}
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')} />
              {errors.email && <span className="error">{errors.email}</span>}
            </label>
            <label>
              Phone (optional)
              <input value={form.phone} onChange={set('phone')} />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </label>
            <label>
              Seats
              <input type="number" min="1" value={form.seats} onChange={set('seats')} />
              {errors.seats && <span className="error">{errors.seats}</span>}
            </label>
            <div className="row">
              <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn">Register</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Home({ store }) {
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')

  const events = [...store.events]
    .filter((e) => `${e.title} ${e.location}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  return (
    <>
      <div className="page-head">
        <h1>Upcoming events</h1>
        <input
          className="search"
          placeholder="Search events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {events.length === 0 && <p className="muted">No events found.</p>}

      <div className="grid">
        {events.map((ev) => {
          const left = Math.max(0, Number(ev.capacity) - store.seatsTaken(ev.id))
          return (
            <article className="card" key={ev.id}>
              <h3>{ev.title}</h3>
              <p className="muted">{formatDate(ev.date, ev.time)}</p>
              <p className="muted">{ev.location}</p>
              <p>{ev.description}</p>
              <div className="row">
                <span className={left === 0 ? 'tag full' : 'tag'}>
                  {left === 0 ? 'Sold out' : `${left} seats left`}
                </span>
                <button className="btn" disabled={left === 0} onClick={() => setSelected(ev)}>
                  Register
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {selected && (
        <RegisterForm event={selected} store={store} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
