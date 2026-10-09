import { useMemo, useState } from 'react'
import { useDB } from '../../lib/db'
import { exportCSV, exportExcel, formatDateTime, money } from '../../lib/util'
import { Badge, Empty, Modal, Ticket, statusTone } from '../../components/ui'

/* ================= Bookings ================= */
export function Bookings() {
  const { db, event, pass, userById, setBookingStatus } = useDB()
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)

  const list = useMemo(
    () =>
      [...db.bookings]
        .filter((b) => status === 'all' || b.status === status)
        .filter((b) => {
          if (!q) return true
          const hay = `${b.ref} ${event(b.eventId)?.title} ${userById(b.userId)?.name} ${userById(b.userId)?.email}`.toLowerCase()
          return hay.includes(q.toLowerCase())
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.bookings, status, q, event, userById],
  )
  const counts = (s) => db.bookings.filter((b) => b.status === s).length

  const cancel = (b) => window.confirm(`Cancel booking ${b.ref}?`) && setBookingStatus(b.id, 'cancelled')

  return (
    <>
      <div className="page-head"><h1>Bookings <small>({list.length})</small></h1></div>
      <div className="filters bar">
        <input placeholder="Search ref, event or user…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bookings" />
        <div className="chips">
          {['all', 'pending', 'confirmed', 'cancelled'].map((s) => (
            <button key={s} className={`pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
              {s[0].toUpperCase() + s.slice(1)}{s !== 'all' && ` (${counts(s)})`}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap panel">
        <table>
          <thead><tr><th>Ref</th><th>Event</th><th>User</th><th>Pass</th><th>Total</th><th>Status</th><th>Booked</th><th></th></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td><code>{b.ref}</code></td>
                <td>{event(b.eventId)?.title || <em className="muted">deleted</em>}</td>
                <td>{userById(b.userId)?.name}<br /><small className="muted">{userById(b.userId)?.email}</small></td>
                <td>{pass(b.passId)?.name} × {b.qty}</td>
                <td>{money(b.total)}</td>
                <td><Badge tone={statusTone[b.status]}>{b.status}</Badge></td>
                <td>{formatDateTime(b.createdAt)}</td>
                <td className="row-actions">
                  <button className="btn sm" onClick={() => setOpen(b.id)}>Details</button>
                  {b.status !== 'confirmed' && b.status !== 'cancelled' && <button className="btn sm ok" onClick={() => setBookingStatus(b.id, 'confirmed')}>Confirm</button>}
                  {b.status === 'cancelled' && <button className="btn sm ok" onClick={() => setBookingStatus(b.id, 'confirmed')}>Reinstate</button>}
                  {b.status !== 'cancelled' && <button className="btn sm danger" onClick={() => cancel(b)}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty>No bookings found.</Empty>}
      </div>
      {open && (
        <Modal title="Booking details" onClose={() => setOpen(null)} wide>
          <Ticket booking={db.bookings.find((b) => b.id === open)} />
          {(() => {
            const u = userById(db.bookings.find((b) => b.id === open)?.userId)
            return u ? <p className="meta mt">📞 {u.phone} · ✉️ {u.email}</p> : null
          })()}
        </Modal>
      )}
    </>
  )
}

/* ================= Users & login tracking ================= */
export function Users() {
  const { db } = useDB()
  const [tab, setTab] = useState('users')
  const rows = useMemo(
    () =>
      db.users.map((u) => {
        const logs = db.loginLogs.filter((l) => l.role === 'user' && l.userId === u.id)
        const bk = db.bookings.filter((b) => b.userId === u.id)
        return {
          u,
          logins: logs.length,
          last: logs.map((l) => l.at).sort().pop(),
          bookings: bk.length,
          events: new Set(bk.filter((b) => b.status !== 'cancelled').map((b) => b.eventId)).size,
          spent: bk.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.total, 0),
        }
      }),
    [db],
  )
  const logs = [...db.loginLogs].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200)

  return (
    <>
      <div className="page-head"><h1>Users &amp; activity</h1></div>
      <div className="chips">
        <button className={`pill ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users ({db.users.length})</button>
        <button className={`pill ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>Login log</button>
      </div>
      <div className="table-wrap panel">
        {tab === 'users' ? (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Logins</th><th>Last login</th><th>Events joined</th><th>Bookings</th><th>Confirmed spend</th></tr></thead>
            <tbody>
              {rows.map(({ u, logins, last, bookings, events, spent }) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.phone}</td>
                  <td>{formatDateTime(u.createdAt).split(',').slice(0, 2).join(',')}</td>
                  <td>{logins}</td><td>{last ? formatDateTime(last) : '—'}</td>
                  <td>{events}</td><td>{bookings}</td><td>{money(spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead><tr><th>When</th><th>Role</th><th>Name</th><th>Email / username</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}><td>{formatDateTime(l.at)}</td><td><Badge tone={l.role === 'admin' ? 'blue' : 'gray'}>{l.role}</Badge></td><td>{l.name}</td><td>{l.email}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/* ================= Contact queries ================= */
export function Queries() {
  const { db, edit, remove } = useDB()
  const [filter, setFilter] = useState('all')
  const list = [...db.queries].filter((q) => filter === 'all' || q.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <div className="page-head"><h1>User queries <small>({list.length})</small></h1></div>
      <div className="chips">
        {['all', 'new', 'resolved'].map((s) => (
          <button key={s} className={`pill ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
        ))}
      </div>
      {list.length === 0 ? <Empty>No queries.</Empty> : (
        <div className="query-list">
          {list.map((q) => (
            <div className="card pad query" key={q.id}>
              <div className="query-top">
                <div>
                  <strong>{q.subject}</strong>
                  <p className="meta">{q.name} · <a href={`mailto:${q.email}?subject=${encodeURIComponent('Re: ' + q.subject)}`}>{q.email}</a> · {formatDateTime(q.createdAt)}</p>
                </div>
                <Badge tone={statusTone[q.status]}>{q.status}</Badge>
              </div>
              <p className="msg">{q.message}</p>
              <div className="row-actions">
                {q.status !== 'resolved' ? <button className="btn sm ok" onClick={() => edit('queries', q.id, { status: 'resolved' })}>Mark resolved</button> : <button className="btn sm" onClick={() => edit('queries', q.id, { status: 'new' })}>Reopen</button>}
                <button className="btn sm danger" onClick={() => window.confirm('Delete this query?') && remove('queries', q.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ================= Reports ================= */
export function Reports() {
  const { db, event, pass, userById, category, taken } = useDB()
  const [kind, setKind] = useState('registrations')

  const reports = useMemo(
    () => ({
      registrations: {
        title: 'Registrations per event',
        rows: db.events.map((e) => {
          const bk = db.bookings.filter((b) => b.eventId === e.id)
          const live = bk.filter((b) => b.status !== 'cancelled')
          return {
            Event: e.title, Category: category(e.categoryId)?.name || '', Date: e.date, City: e.city, Active: e.active ? 'Yes' : 'No',
            Capacity: e.capacity, 'Seats booked': taken(e.id), 'Seats left': e.capacity - taken(e.id),
            Bookings: live.length, 'Confirmed revenue (INR)': bk.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.total, 0),
          }
        }),
      },
      bookings: {
        title: 'All bookings',
        rows: [...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((b) => ({
          Reference: b.ref, Event: event(b.eventId)?.title || 'Deleted', User: userById(b.userId)?.name || '', Email: userById(b.userId)?.email || '',
          Pass: pass(b.passId)?.name || '', Quantity: b.qty, 'Unit price (INR)': b.unitPrice, 'Total (INR)': b.total, Status: b.status, 'Booked at': b.createdAt,
        })),
      },
      users: {
        title: 'Users',
        rows: db.users.map((u) => {
          const logs = db.loginLogs.filter((l) => l.role === 'user' && l.userId === u.id)
          const bk = db.bookings.filter((b) => b.userId === u.id)
          return {
            Name: u.name, Email: u.email, Phone: u.phone, Joined: u.createdAt, Logins: logs.length,
            'Last login': logs.map((l) => l.at).sort().pop() || '', Bookings: bk.length,
            'Events attended/booked': new Set(bk.filter((b) => b.status !== 'cancelled').map((b) => b.eventId)).size,
          }
        }),
      },
      logins: {
        title: 'Login activity',
        rows: [...db.loginLogs].sort((a, b) => b.at.localeCompare(a.at)).map((l) => ({ When: l.at, Role: l.role, Name: l.name, 'Email / username': l.email })),
      },
      queries: {
        title: 'Contact queries',
        rows: db.queries.map((q) => ({ Name: q.name, Email: q.email, Subject: q.subject, Message: q.message, Status: q.status, Received: q.createdAt })),
      },
    }),
    [db, event, pass, userById, category, taken],
  )

  const r = reports[kind]
  const headers = r.rows[0] ? Object.keys(r.rows[0]) : []
  const stamp = new Date().toISOString().slice(0, 10)
  const file = `eventra-${kind}-${stamp}`

  return (
    <>
      <div className="page-head">
        <h1>Reports</h1>
        <div className="row-actions">
          <button className="btn" disabled={!r.rows.length} onClick={() => exportCSV(file, r.rows)}>⬇ CSV</button>
          <button className="btn primary" disabled={!r.rows.length} onClick={() => exportExcel(file, r.rows, r.title)}>⬇ Excel</button>
        </div>
      </div>
      <div className="chips">
        {Object.entries(reports).map(([k, v]) => (
          <button key={k} className={`pill ${kind === k ? 'active' : ''}`} onClick={() => setKind(k)}>{v.title}</button>
        ))}
      </div>
      <div className="table-wrap panel">
        {r.rows.length === 0 ? <Empty>No data for this report.</Empty> : (
          <table>
            <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {r.rows.slice(0, 100).map((row, i) => (
                <tr key={i}>{headers.map((h) => <td key={h}>{String(row[h])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {r.rows.length > 100 && <p className="muted">Showing first 100 of {r.rows.length} rows – exports contain everything.</p>}
    </>
  )
}
