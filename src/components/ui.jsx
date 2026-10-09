import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useDB } from '../lib/db'
import { formatDate, money, formatDateTime } from '../lib/util'

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export const Badge = ({ tone = 'gray', children }) => <span className={`badge ${tone}`}>{children}</span>

export const statusTone = { confirmed: 'green', pending: 'amber', cancelled: 'red', new: 'amber', resolved: 'green', read: 'blue' }

export const Field = ({ label, children, hint }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
)

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  )
}

export const Empty = ({ children }) => <div className="empty">{children}</div>

export function QR({ value, size = 180 }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' }).then((u) => live && setSrc(u))
    return () => {
      live = false
    }
  }, [value, size])
  return src ? <img src={src} width={size} height={size} alt="Booking QR code" className="qr" /> : <div style={{ width: size, height: size }} />
}

/** The string encoded in every booking QR. */
export const qrPayload = (b, ev, pass, user) =>
  ['EVENTRA', b.ref, ev?.id, pass?.name, `x${b.qty}`, user?.name].join('|')

export function EventCard({ ev, onOpen }) {
  const { category, seatsLeft, db } = useDB()
  const cat = category(ev.categoryId)
  const left = seatsLeft(ev)
  const minPrice = Math.min(...db.passes.filter((p) => p.active).map((p) => Math.round(ev.basePrice * p.multiplier)))
  return (
    <article className="card event-card">
      <div className="event-art" style={{ background: `linear-gradient(135deg, ${cat?.color || '#475569'}, #0f172a)` }}>
        <span className="art-icon" aria-hidden="true">{cat?.icon}</span>
        <span className="chip">{cat?.name}</span>
        {left === 0 ? <span className="chip sold">Sold out</span> : left < 50 ? <span className="chip warn">{left} left</span> : null}
      </div>
      <div className="event-body">
        <h3>{ev.title}</h3>
        <p className="meta">📅 {formatDate(ev.date, ev.time)}</p>
        <p className="meta">📍 {ev.venue}, {ev.city}</p>
        <div className="event-foot">
          <div>
            <small>From</small>
            <strong>{money(minPrice)}</strong>
          </div>
          <button className="btn primary" disabled={left === 0} onClick={() => onOpen(ev)}>
            {left === 0 ? 'Sold out' : 'Book now'}
          </button>
        </div>
      </div>
    </article>
  )
}

/** Ticket view with QR – used in user profile and admin booking details. */
export function Ticket({ booking }) {
  const { event, pass, userById } = useDB()
  const ev = event(booking.eventId)
  const p = pass(booking.passId)
  const u = userById(booking.userId)
  return (
    <div className={`ticket ${booking.status}`}>
      <div className="ticket-info">
        <h4>{ev?.title || 'Deleted event'}</h4>
        <p>📅 {ev && formatDate(ev.date, ev.time)}</p>
        <p>📍 {ev && `${ev.venue}, ${ev.city}`}</p>
        <dl>
          <dt>Booking ref</dt><dd><code>{booking.ref}</code></dd>
          <dt>Pass</dt><dd>{p?.name} × {booking.qty}</dd>
          <dt>Total</dt><dd>{money(booking.total)}</dd>
          <dt>Booked</dt><dd>{formatDateTime(booking.createdAt)}</dd>
          <dt>Attendee</dt><dd>{u?.name}</dd>
          <dt>Status</dt><dd><Badge tone={statusTone[booking.status]}>{booking.status}</Badge></dd>
        </dl>
      </div>
      <div className="ticket-qr">
        <div className={booking.status === 'cancelled' ? 'qr-void' : ''}>
          <QR value={qrPayload(booking, ev, p, u)} size={170} />
        </div>
        <small>
          {booking.status === 'confirmed' && 'Show this QR at the entry gate'}
          {booking.status === 'pending' && 'Valid once the organiser confirms'}
          {booking.status === 'cancelled' && 'Cancelled – QR is void'}
        </small>
      </div>
    </div>
  )
}
