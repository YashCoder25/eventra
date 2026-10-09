# 🎟️ Eventra – React Event Booking Platform

A BookMyShow-style app built with **React 19 + Vite**, with a public **User Interface** and a separate **Admin Panel**.
Data lives in a JSON file (`public/data/db.json`, 50 events) and is persisted in the browser, so changes survive reloads.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run seed       # regenerate public/data/db.json (50 events)
```

## Demo logins
| Role  | Login                                        |
|-------|----------------------------------------------|
| Admin | `#/admin` → `admin` / `admin123`             |
| User  | `user@eventra.com` / `user123` (or register) |

## Routes
**User:** `#/` (index), `#/event/:id`, `#/book/:id`, `#/login`, `#/register`, `#/profile`, `#/about`, `#/contact`
**Admin:** `#/admin` (login) → `dashboard`, `categories`, `events`, `passes`, `bookings`, `users`, `queries`, `reports`

## Features
- **Sessions & cookies:** separate `eventra_admin` (8 h) and `eventra_user` (7 days with "remember me") cookies; sessions are validated on every route change and expire automatically. Admin login has a 5-attempt lockout.
- **Admin:** dashboard with stats and a registrations-per-event chart; CRUD for categories, events (Active/Inactive toggle) and pass categories (Normal/VIP/VVIP price multipliers); confirm/cancel/view bookings; user and login tracking; contact-form queries; CSV and Excel (.xlsx) report export.
- **User:** upcoming-event cards with search / category / city / sort; event detail; 3-step booking (pass → confirm → ticket); **unique QR code per booking**; bookings saved in the profile; About and Contact pages (queries appear in the admin panel).
- Fully responsive (mobile + desktop).

## Data model (`db.json`)
`admins, categories, passes, events (50), users, bookings, loginLogs, queries`.
Ticket price = event `basePrice` × pass `multiplier`. "Reset demo data" in the admin sidebar reloads the original JSON.

## Important notes
- This is a **front-end-only** build (like your original scaffold, which had no server). Passwords are SHA-256 hashed and sessions use cookie + localStorage, which is fine for a demo or college project but **not secure for production**. For real use, move auth, bookings and the data to a backend (Node/Express + a database) that issues HttpOnly cookies. The actions in `src/lib/db.jsx` map 1:1 to API endpoints.
- Browsers cannot write to `db.json` directly, so edits are stored in `localStorage` (key `eventra_db_v1`).
- Payment is simulated: bookings start as **pending** until an admin confirms them.
