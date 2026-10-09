import { useEffect, useState } from 'react'

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export const todayISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function formatDate(date, time) {
  if (!date) return ''
  const d = new Date(`${date}T${time || '00:00'}`)
  if (Number.isNaN(d.getTime())) return date
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return time ? `${day} · ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : day
}

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

export const shortDate = (date) =>
  new Date(`${date}T00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export const bookingRef = () => {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)]
  return `EVT-${s}`
}

/* ---------- exports ---------- */
function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const csvCell = (v) => {
  let s = v == null ? '' : String(v)
  // neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCSV(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [headers.map(csvCell).join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))]
  download(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`)
}

export async function exportExcel(filename, rows, sheet = 'Report') {
  if (!rows.length) return
  const XLSX = await import('xlsx') // lazy-loaded: keeps the main bundle small
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31))
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/* ---------- hash router ---------- */
const getHash = () => window.location.hash.replace(/^#/, '') || '/'

export function useHashRoute() {
  const [route, setRoute] = useState(getHash)
  useEffect(() => {
    const on = () => {
      setRoute(getHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const navigate = (path) => {
  window.location.hash = path
}

/** Match "/event/:id" style patterns. Returns params object or null. */
export function match(pattern, path) {
  const [p] = path.split('?')
  const a = pattern.split('/').filter(Boolean)
  const b = p.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}

export const queryParams = (path) => {
  const q = path.split('?')[1] || ''
  return Object.fromEntries(new URLSearchParams(q))
}
