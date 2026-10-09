import { useEffect } from 'react'
import { useDB } from './lib/db'
import { match, navigate, useHashRoute } from './lib/util'
import Home from './pages/user/Home'
import { EventDetail, Book } from './pages/user/Booking'
import { Login, Register, Profile, About, Contact } from './pages/user/Account'
import AdminApp from './pages/admin/AdminApp'

function Header({ route }) {
  const { user, logoutUser } = useDB()
  const is = (p) => (p === '/' ? route === '/' || route.startsWith('/event') || route.startsWith('/book') : route.startsWith(p))
  return (
    <header className="topbar">
      <div className="container bar-inner">
        <a className="brand" href="#/">🎟️ Eventra</a>
        <nav>
          <a href="#/" className={is('/') ? 'active' : ''}>Events</a>
          <a href="#/about" className={is('/about') ? 'active' : ''}>About</a>
          <a href="#/contact" className={is('/contact') ? 'active' : ''}>Contact</a>
          {user ? (
            <>
              <a href="#/profile" className={is('/profile') ? 'active' : ''}>My bookings</a>
              <button className="btn sm" onClick={() => { logoutUser(); navigate('/') }}>Logout</button>
            </>
          ) : (
            <>
              <a href="#/login" className={is('/login') ? 'active' : ''}>Log in</a>
              <a href="#/register" className="btn sm primary">Sign up</a>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <span>© {new Date().getFullYear()} Eventra – book the moments that matter.</span>
      <span><a href="#/about">About</a> · <a href="#/contact">Contact</a> · <a href="#/admin">Admin</a></span>
    </div>
  </footer>
)

function Redirect({ to }) {
  useEffect(() => navigate(to), [to])
  return null
}

export default function App() {
  const route = useHashRoute()
  if (route.startsWith('/admin')) return <AdminApp route={route} />

  const path = route.split('?')[0]
  let page
  let m
  if (path === '/') page = <Home />
  else if ((m = match('/event/:id', path))) page = <EventDetail id={m.id} />
  else if ((m = match('/book/:id', path))) page = <Book id={m.id} />
  else if (path === '/login') page = <Login route={route} />
  else if (path === '/register') page = <Register route={route} />
  else if (path === '/profile') page = <Profile />
  else if (path === '/about') page = <About />
  else if (path === '/contact') page = <Contact />
  else page = <Redirect to="/" />

  return (
    <div className="site">
      <Header route={route} />
      <main>{page}</main>
      <Footer />
    </div>
  )
}
