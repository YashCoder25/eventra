import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hashPassword, createSession, getSession, destroySession } from './auth'
import { bookingRef, uid } from './util'

/*
 * "Database" = public/data/db.json (seed: 50 events, users, bookings…).
 * It is loaded once, then kept in localStorage so admin/user changes persist.
 * "Reset demo data" in the admin panel re-loads the original JSON file.
 */
const KEY = 'eventra_db_v1'
const Ctx = createContext(null)
export const useDB = () => useContext(Ctx)

const fetchSeed = async () => {
  const res = await fetch(`${import.meta.env.BASE_URL}data/db.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Could not load data/db.json')
  return res.json()
}

export function DBProvider({ children }) {
  const [db, setDb] = useState(null)
  const [error, setError] = useState('')
  const [sess, setSess] = useState({ admin: null, user: null })

  const refreshSession = useCallback(() => {
    setSess((s) => {
      const next = { admin: getSession('admin'), user: getSession('user') }
      return s.admin === next.admin && s.user === next.user ? s : next
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let saved = null
        try {
          saved = JSON.parse(localStorage.getItem(KEY))
        } catch {
          /* corrupt – fall through to seed */
        }
        const data = saved && saved.events ? saved : await fetchSeed()
        if (!cancelled) setDb(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    })()
    refreshSession()
    const t = setInterval(refreshSession, 30000) // picks up session expiry
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue) setDb(JSON.parse(e.newValue))
      refreshSession()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('hashchange', refreshSession)
    return () => {
      cancelled = true
      clearInterval(t)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('hashchange', refreshSession)
    }
  }, [refreshSession])

  useEffect(() => {
    if (!db) return
    try {
      localStorage.setItem(KEY, JSON.stringify(db))
    } catch {
      /* storage blocked/full */
    }
  }, [db])

  const api = useMemo(() => {
    const mutate = (fn) => setDb((d) => fn(d))

    return {
      add(coll, item) {
        const full = { id: uid(coll.slice(0, 3)), createdAt: new Date().toISOString(), ...item }
        mutate((d) => ({ ...d, [coll]: [...d[coll], full] }))
        return full
      },
      edit(coll, id, patch) {
        mutate((d) => ({ ...d, [coll]: d[coll].map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
      },
      remove(coll, id) {
        mutate((d) => {
          const next = { ...d, [coll]: d[coll].filter((x) => x.id !== id) }
          if (coll === 'events') next.bookings = d.bookings.filter((b) => b.eventId !== id) // cascade
          return next
        })
      },
      async reset() {
        const seed = await fetchSeed()
        setDb(seed)
      },

      /* ---- user auth ---- */
      registerUser({ name, email, phone, password }, remember = true) {
        const mail = email.trim().toLowerCase()
        if (db.users.some((u) => u.email === mail)) return { error: 'An account with this email already exists.' }
        const user = {
          id: uid('usr'), name: name.trim(), email: mail, phone: phone.trim(),
          passwordHash: hashPassword(password), createdAt: new Date().toISOString(),
        }
        mutate((d) => ({
          ...d,
          users: [...d.users, user],
          loginLogs: [...d.loginLogs, { id: uid('log'), role: 'user', userId: user.id, name: user.name, email: user.email, at: new Date().toISOString() }],
        }))
        createSession('user', user.id, remember)
        refreshSession()
        return { user }
      },
      loginUser(email, password, remember = true) {
        const user = db.users.find((u) => u.email === email.trim().toLowerCase())
        if (!user || user.passwordHash !== hashPassword(password)) return { error: 'Invalid email or password.' }
        mutate((d) => ({
          ...d,
          loginLogs: [...d.loginLogs, { id: uid('log'), role: 'user', userId: user.id, name: user.name, email: user.email, at: new Date().toISOString() }],
        }))
        createSession('user', user.id, remember)
        refreshSession()
        return { user }
      },
      logoutUser() {
        destroySession('user')
        refreshSession()
      },

      /* ---- admin auth ---- */
      loginAdmin(username, password) {
        const admin = db.admins.find((a) => a.username === username.trim())
        if (!admin || admin.passwordHash !== hashPassword(password)) return { error: 'Invalid username or password.' }
        mutate((d) => ({
          ...d,
          loginLogs: [...d.loginLogs, { id: uid('log'), role: 'admin', userId: admin.id, name: admin.name, email: admin.username, at: new Date().toISOString() }],
        }))
        createSession('admin', admin.id)
        refreshSession()
        return { admin }
      },
      logoutAdmin() {
        destroySession('admin')
        refreshSession()
      },

      /* ---- bookings ---- */
      createBooking({ userId, eventId, passId, qty }) {
        const ev = db.events.find((e) => e.id === eventId)
        const pass = db.passes.find((p) => p.id === passId)
        if (!ev || !ev.active) return { error: 'This event is not available.' }
        if (!pass || !pass.active) return { error: 'This pass category is not available.' }
        const left = ev.capacity - db.bookings.filter((b) => b.eventId === eventId && b.status !== 'cancelled').reduce((s, b) => s + b.qty, 0)
        if (qty < 1 || qty > left) return { error: `Only ${left} seat(s) left for this event.` }
        const unitPrice = Math.round(ev.basePrice * pass.multiplier)
        const booking = {
          id: uid('bkg'), ref: bookingRef(), userId, eventId, passId, qty, unitPrice,
          total: unitPrice * qty, status: 'pending', createdAt: new Date().toISOString(),
        }
        mutate((d) => ({ ...d, bookings: [...d.bookings, booking] }))
        return { booking }
      },
      setBookingStatus(id, status) {
        mutate((d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }))
      },

      /* ---- contact ---- */
      submitQuery({ name, email, subject, message }) {
        mutate((d) => ({
          ...d,
          queries: [...d.queries, { id: uid('q'), name, email, subject, message, status: 'new', createdAt: new Date().toISOString() }],
        }))
      },
    }
  }, [db, refreshSession])

  const value = useMemo(() => {
    if (!db) return null
    const admin = db.admins.find((a) => a.id === sess.admin) || null
    const user = db.users.find((u) => u.id === sess.user) || null
    const taken = (eventId) =>
      db.bookings.filter((b) => b.eventId === eventId && b.status !== 'cancelled').reduce((s, b) => s + b.qty, 0)
    return {
      db, ...api, admin, user,
      taken,
      seatsLeft: (ev) => Math.max(0, ev.capacity - taken(ev.id)),
      category: (id) => db.categories.find((c) => c.id === id),
      event: (id) => db.events.find((e) => e.id === id),
      pass: (id) => db.passes.find((p) => p.id === id),
      userById: (id) => db.users.find((u) => u.id === id),
    }
  }, [db, api, sess])

  if (error) return <div className="boot error">⚠️ {error}. Make sure <code>public/data/db.json</code> exists.</div>
  if (!value) return <div className="boot">Loading Eventra…</div>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
