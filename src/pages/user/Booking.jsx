import { useState } from 'react'
import { useDB } from '../../lib/db'
import { formatDate, money, navigate } from '../../lib/util'
import { Empty, Ticket } from '../../components/ui'

/* ---------- Event detail ---------- */
export function EventDetail({ id }) {
  const { db, event, category, seatsLeft } = useDB()
  const ev = event(id)
  if (!ev) return <Empty>Event not found. <a href="#/">Browse events</a></Empty>
  const cat = category(ev.categoryId)
  const left = seatsLeft(ev)
  const passes = db.passes.filter((p) => p.active)
  const bookable = ev.active && left > 0

  return (
    <div className="container section">
      <a href="#/" className="back">← All events</a>
      <div className="detail">
        <div className="detail-art" style={{ background: `linear-gradient(135deg, ${cat?.color || '#475569'}, #0f172a)` }}>
          <span aria-hidden="true">{cat?.icon}</span>
        </div>
        <div className="detail-main">
          <span className="chip dark">{cat?.name}</span>
          <h1>{ev.title}</h1>
          <p className="meta">📅 {formatDate(ev.date, ev.time)}</p>
          <p className="meta">📍 {ev.venue}, {ev.city}</p>
          <p className="meta">🎟️ {left > 0 ? `${left} of ${ev.capacity} seats available` : 'Sold out'}</p>
          <p className="desc">{ev.description}</p>
          {!ev.active && <p className="notice">This event is currently not open for booking.</p>}
          <h3>Pass categories</h3>
          <div className="pass-list">
            {passes.map((p) => (
              <div className="pass-row" key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.perks}</small>
                </div>
                <b>{money(Math.round(ev.basePrice * p.multiplier))}</b>
              </div>
            ))}
          </div>
          <button className="btn primary lg" disabled={!bookable} onClick={() => navigate(`/book/${ev.id}`)}>
            {bookable ? 'Book tickets' : 'Not available'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Booking: pass → confirm → ticket ---------- */
export function Book({ id }) {
  const { db, event, user, seatsLeft, createBooking } = useDB()
  const ev = event(id)
  const passes = db.passes.filter((p) => p.active)
  const [passId, setPassId] = useState(passes[0]?.id)
  const [qty, setQty] = useState(1)
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [booking, setBooking] = useState(null)

  if (!ev) return <Empty>Event not found. <a href="#/">Browse events</a></Empty>
  if (!user) {
    return (
      <div className="container section narrow">
        <div className="card pad center">
          <h2>Please log in to book</h2>
          <p>You need an account to book passes and receive your QR ticket.</p>
          <button className="btn primary" onClick={() => navigate(`/login?next=${encodeURIComponent('/book/' + id)}`)}>Log in / Register</button>
        </div>
      </div>
    )
  }

  const left = seatsLeft(ev)
  const pass = passes.find((p) => p.id === passId)
  const unit = pass ? Math.round(ev.basePrice * pass.multiplier) : 0
  const total = unit * qty
  const maxQty = Math.min(10, left)

  const confirm = () => {
    const res = createBooking({ userId: user.id, eventId: ev.id, passId, qty })
    if (res.error) return setErr(res.error)
    setBooking(res.booking)
    setStep(3)
  }

  return (
    <div className="container section narrow">
      <a href={`#/event/${ev.id}`} className="back">← Back to event</a>
      <ol className="steps" aria-label="Booking steps">
        {['Choose pass', 'Confirm', 'Ticket'].map((s, i) => (
          <li key={s} className={step === i + 1 ? 'current' : step > i + 1 ? 'done' : ''}><span>{i + 1}</span>{s}</li>
        ))}
      </ol>

      <div className="card pad">
        <h2>{ev.title}</h2>
        <p className="meta">📅 {formatDate(ev.date, ev.time)} &nbsp; 📍 {ev.venue}, {ev.city}</p>

        {step === 1 && (
          <>
            <h3>Select pass category</h3>
            <div className="pass-pick">
              {passes.map((p) => (
                <button key={p.id} type="button" className={`pass-card ${passId === p.id ? 'selected' : ''}`} onClick={() => setPassId(p.id)}>
                  <strong>{p.name}</strong>
                  <b>{money(Math.round(ev.basePrice * p.multiplier))}</b>
                  <small>{p.perks}</small>
                </button>
              ))}
            </div>
            <div className="qty">
              <span>Tickets</span>
              <div className="stepper">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer">−</button>
                <output>{qty}</output>
                <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="More">+</button>
              </div>
              <small>Max {maxQty} per booking</small>
            </div>
            <div className="total-bar">
              <div><small>Total</small><strong>{money(total)}</strong></div>
              <button className="btn primary" disabled={!pass || maxQty < 1} onClick={() => setStep(2)}>Continue</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Review &amp; confirm</h3>
            <table className="summary">
              <tbody>
                <tr><td>Attendee</td><td>{user.name} ({user.email})</td></tr>
                <tr><td>Pass</td><td>{pass.name}</td></tr>
                <tr><td>Price per ticket</td><td>{money(unit)}</td></tr>
                <tr><td>Tickets</td><td>{qty}</td></tr>
                <tr className="grand"><td>Total</td><td>{money(total)}</td></tr>
              </tbody>
            </table>
            <p className="hint">Payment is collected at the venue in this demo. Your booking will be marked <b>pending</b> until confirmed by the organiser.</p>
            {err && <p className="error" role="alert">{err}</p>}
            <div className="row-end">
              <button className="btn" onClick={() => setStep(1)}>Back</button>
              <button className="btn primary" onClick={confirm}>Confirm booking</button>
            </div>
          </>
        )}

        {step === 3 && booking && (
          <>
            <div className="success">✅ Booking placed! Your ticket is saved in your profile.</div>
            <Ticket booking={booking} />
            <div className="row-end">
              <button className="btn" onClick={() => navigate('/')}>Browse more</button>
              <button className="btn primary" onClick={() => navigate('/profile')}>View my bookings</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
