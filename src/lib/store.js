import { useCallback, useEffect, useState } from 'react'

const EVENTS_KEY = 'eventra_events'
const REGS_KEY = 'eventra_registrations'
const AUTH_KEY = 'eventra_admin_auth'

// Demo admin credentials (client-side only, NOT secure). Change before use.
export const ADMIN_USER = 'admin'
export const ADMIN_PASS = 'admin123'

const seedEvents = [
  {
    id: 'evt-1',
    title: 'React Meetup',
    date: '2026-11-15',
    time: '18:00',
    location: 'Surat Tech Hub',
    description: 'Talks and networking for React developers.',
    capacity: 50,
  },
]

const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked */
  }
}

// Keeps state in sync with localStorage (also across tabs).
function usePersisted(key, initial) {
  const [value, setValue] = useState(() => read(key, initial))

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) setValue(read(key, initial))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (updater) => {
      setValue((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        write(key, next)
        return next
      })
    },
    [key],
  )

  return [value, update]
}

export function useEventStore() {
  const [events, setEvents] = usePersisted(EVENTS_KEY, seedEvents)
  const [registrations, setRegistrations] = usePersisted(REGS_KEY, [])

  const addEvent = (data) =>
    setEvents((list) => [...list, { ...data, id: uid('evt') }])

  const updateEvent = (id, data) =>
    setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...data } : e)))

  const deleteEvent = (id) => {
    setEvents((list) => list.filter((e) => e.id !== id))
    setRegistrations((list) => list.filter((r) => r.eventId !== id))
  }

  const addRegistration = (data) =>
    setRegistrations((list) => [
      ...list,
      { ...data, id: uid('reg'), createdAt: new Date().toISOString() },
    ])

  const deleteRegistration = (id) =>
    setRegistrations((list) => list.filter((r) => r.id !== id))

  const seatsTaken = (eventId) =>
    registrations
      .filter((r) => r.eventId === eventId)
      .reduce((sum, r) => sum + Number(r.seats || 1), 0)

  return {
    events,
    registrations,
    addEvent,
    updateEvent,
    deleteEvent,
    addRegistration,
    deleteRegistration,
    seatsTaken,
  }
}

export function useAdminAuth() {
  const [authed, setAuthed] = useState(() => read(AUTH_KEY, false))

  const login = (user, pass) => {
    const ok = user === ADMIN_USER && pass === ADMIN_PASS
    if (ok) {
      write(AUTH_KEY, true)
      setAuthed(true)
    }
    return ok
  }

  const logout = () => {
    write(AUTH_KEY, false)
    setAuthed(false)
  }

  return { authed, login, logout }
}

export function useHashRoute() {
  const get = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(get)

  useEffect(() => {
    const onChange = () => setRoute(get())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export const formatDate = (date, time) => {
  if (!date) return ''
  const d = new Date(`${date}T${time || '00:00'}`)
  if (Number.isNaN(d.getTime())) return date
  const day = d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return time
    ? `${day} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    : day
}
