import { useMemo, useState } from 'react'
import { useDB } from '../../lib/db'
import { navigate, todayISO } from '../../lib/util'
import { EventCard, Empty } from '../../components/ui'

const PAGE = 12

export default function Home() {
  const { db } = useDB()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [city, setCity] = useState('all')
  const [sort, setSort] = useState('date')
  const [shown, setShown] = useState(PAGE)

  const today = todayISO()
  const upcoming = useMemo(
    () => db.events.filter((e) => e.active && e.date >= today && db.categories.find((c) => c.id === e.categoryId)?.active),
    [db, today],
  )
  const cities = useMemo(() => [...new Set(upcoming.map((e) => e.city))].sort(), [upcoming])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const out = upcoming.filter(
      (e) =>
        (cat === 'all' || e.categoryId === cat) &&
        (city === 'all' || e.city === city) &&
        (!term || `${e.title} ${e.city} ${e.venue}`.toLowerCase().includes(term)),
    )
    out.sort((a, b) =>
      sort === 'price' ? a.basePrice - b.basePrice : sort === 'priceDesc' ? b.basePrice - a.basePrice : a.date.localeCompare(b.date),
    )
    return out
  }, [upcoming, q, cat, city, sort])

  const reset = (fn) => (v) => {
    fn(v)
    setShown(PAGE)
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Live events, <span>one tap away</span></h1>
          <p>Concerts, festivals, DJ nights, cultural shows and sports – book your pass and get a QR ticket instantly.</p>
          <div className="search">
            <input value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder="Search events, venues or cities…" aria-label="Search events" />
          </div>
          <div className="hero-stats">
            <div><strong>{upcoming.length}</strong><span>Upcoming events</span></div>
            <div><strong>{new Set(upcoming.map((e) => e.city)).size}</strong><span>Cities</span></div>
            <div><strong>{db.categories.filter((c) => c.active).length}</strong><span>Categories</span></div>
          </div>
        </div>
      </section>

      <section className="container section" id="events">
        <div className="chips" role="tablist" aria-label="Categories">
          <button className={`pill ${cat === 'all' ? 'active' : ''}`} onClick={() => reset(setCat)('all')}>All</button>
          {db.categories.filter((c) => c.active).map((c) => (
            <button key={c.id} className={`pill ${cat === c.id ? 'active' : ''}`} onClick={() => reset(setCat)(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <h2>Upcoming events <small>({list.length})</small></h2>
          <div className="filters">
            <select value={city} onChange={(e) => reset(setCity)(e.target.value)} aria-label="City">
              <option value="all">All cities</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="date">Soonest first</option>
              <option value="price">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <Empty>No events match your filters.</Empty>
        ) : (
          <>
            <div className="grid">
              {list.slice(0, shown).map((ev) => (
                <EventCard key={ev.id} ev={ev} onOpen={(e) => navigate(`/event/${e.id}`)} />
              ))}
            </div>
            {shown < list.length && (
              <div className="center">
                <button className="btn" onClick={() => setShown((n) => n + PAGE)}>Show more events</button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
