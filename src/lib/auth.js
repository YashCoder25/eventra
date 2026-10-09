import { sha256 } from 'js-sha256'

/*
 * Sessions & cookies (client-side demo).
 *  - A random session token is stored in a cookie (eventra_admin / eventra_user).
 *  - The session record (who, expiry) lives in localStorage under eventra_sessions.
 *  - Admin and user sessions are independent.
 * For production, replace with a real backend that issues HttpOnly cookies.
 */

const SESSIONS_KEY = 'eventra_sessions'
export const COOKIE = { admin: 'eventra_admin', user: 'eventra_user' }
const TTL = { admin: 8 * 3600, user: 7 * 86400 } // seconds

export const hashPassword = (pw) => sha256(String(pw))

export function setCookie(name, value, maxAgeSec) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Lax']
  if (maxAgeSec) parts.push(`max-age=${maxAgeSec}`)
  if (location.protocol === 'https:') parts.push('Secure')
  document.cookie = parts.join('; ')
}

export function getCookie(name) {
  const m = document.cookie.split('; ').find((c) => c.startsWith(name + '='))
  return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : null
}

export const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

function readSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || {}
  } catch {
    return {}
  }
}
function writeSessions(s) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

const token = () => {
  const a = new Uint8Array(24)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** role: 'admin' | 'user'. remember=false → browser-session cookie (no max-age). */
export function createSession(role, subjectId, remember = true) {
  const t = token()
  const sessions = readSessions()
  const now = Date.now()
  // drop expired sessions
  for (const k of Object.keys(sessions)) if (sessions[k].exp < now) delete sessions[k]
  sessions[t] = { role, subjectId, exp: now + TTL[role] * 1000 }
  writeSessions(sessions)
  setCookie(COOKIE[role], t, role === 'admin' || remember ? TTL[role] : 0)
  return t
}

/** Returns subjectId for a valid session, otherwise null. */
export function getSession(role) {
  const t = getCookie(COOKIE[role])
  if (!t) return null
  const s = readSessions()[t]
  if (!s || s.role !== role || s.exp < Date.now()) return null
  return s.subjectId
}

export function destroySession(role) {
  const t = getCookie(COOKIE[role])
  if (t) {
    const s = readSessions()
    delete s[t]
    writeSessions(s)
  }
  deleteCookie(COOKIE[role])
}
