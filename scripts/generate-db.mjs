// Generates public/data/db.json  (run: npm run seed)
import fs from 'fs'
import { sha256 } from 'js-sha256'

const categories = [
  { id: 'cat-concert', name: 'Concerts', icon: '🎤', color: '#e11d48', description: 'Live music from bands and solo artists', active: true },
  { id: 'cat-festival', name: 'Festivals', icon: '🎪', color: '#f59e0b', description: 'Multi-day festivals, food and fun', active: true },
  { id: 'cat-sports', name: 'Sports', icon: '🏏', color: '#16a34a', description: 'Matches, tournaments and marathons', active: true },
  { id: 'cat-dj', name: 'DJ Nights', icon: '🎧', color: '#7c3aed', description: 'Club nights and EDM parties', active: true },
  { id: 'cat-cultural', name: 'Cultural Shows', icon: '🎭', color: '#0891b2', description: 'Dance, theatre and heritage shows', active: true },
  { id: 'cat-comedy', name: 'Comedy', icon: '😂', color: '#ea580c', description: 'Stand-up and improv nights', active: true },
  { id: 'cat-workshop', name: 'Workshops & Tech', icon: '💡', color: '#2563eb', description: 'Learning sessions, meetups and conferences', active: true },
]

const passes = [
  { id: 'pass-normal', name: 'Normal', multiplier: 1, perks: 'General entry', active: true },
  { id: 'pass-vip', name: 'VIP', multiplier: 2.5, perks: 'Priority entry, reserved seating, complimentary drink', active: true },
  { id: 'pass-vvip', name: 'VVIP', multiplier: 5, perks: 'Front-row access, backstage meet & greet, lounge, buffet', active: true },
]

// [title, category, city, venue, basePrice, time, description, capacity]
const rows = [
  // Concerts (9)
  ['Soulful Sufi Evenings', 'cat-concert', 'Ahmedabad', 'Riverfront Amphitheatre', 799, '19:00', 'An evening of Sufi classics and qawwali performed live under the open sky.', 1500],
  ['Bollywood Unplugged Live', 'cat-concert', 'Mumbai', 'Bayview Dome', 1499, '19:30', 'Your favourite film songs reimagined in a stripped-down acoustic format.', 2500],
  ['Indie Rock Revival Tour', 'cat-concert', 'Pune', 'Open Grounds Arena', 999, '18:30', 'Five up-and-coming indie bands on one stage, ending with a headline set.', 3000],
  ['Classical Fusion Symphony', 'cat-concert', 'Bengaluru', 'Harmony Concert Hall', 1199, '18:00', 'Hindustani ragas meet a full western orchestra for a one-night fusion.', 900],
  ['Retro Melodies Night', 'cat-concert', 'Surat', 'Riverside Auditorium', 599, '19:00', 'Golden-era hits from the 60s, 70s and 80s with a live 12-piece band.', 1200],
  ['Punjabi Beats Live', 'cat-concert', 'Chandigarh', 'Sector Grounds', 899, '20:00', 'High-energy Punjabi chartbusters, dhol drummers and a massive dance floor.', 4000],
  ['Gazal & Chai', 'cat-concert', 'Lucknow', 'Heritage Courtyard', 699, '19:00', 'Intimate gazal evening with chai and shayari between sets.', 500],
  ['Electric Blues Jam', 'cat-concert', 'Goa', 'Beachside Stage', 849, '20:30', 'Blues, funk and jazz jam with guest musicians from across the country.', 800],
  ['Carnatic Rhythms Night', 'cat-concert', 'Chennai', 'Academy Lawns', 549, '18:30', 'Veena, violin and mridangam in a spirited concert for connoisseurs and first-timers.', 1000],
  // Festivals (8)
  ['Navratri Garba Mahotsav', 'cat-festival', 'Surat', 'Garba Grounds', 499, '19:30', 'Nine nights of garba and dandiya with a live orchestra and festive food stalls.', 8000],
  ['Rann Utsav Desert Carnival', 'cat-festival', 'Kutch', 'White Desert Camp', 2999, '16:00', 'Folk music, handicraft bazaars and moonlit camping at the white desert.', 1500],
  ['International Kite Festival', 'cat-festival', 'Ahmedabad', 'Riverfront Ground', 299, '09:00', 'Kite makers and flyers from around the world fill the sky for Uttarayan.', 10000],
  ['Street Food Carnival', 'cat-festival', 'Delhi', 'Central Park Lawns', 349, '12:00', '100+ food stalls, live cooking battles and a kids’ zone.', 6000],
  ['Wine & Jazz Weekend', 'cat-festival', 'Nashik', 'Vineyard Estate', 1799, '15:00', 'Vineyard tours, tastings and live jazz across two relaxed days.', 1200],
  ['Holi Colour Fest', 'cat-festival', 'Jaipur', 'Fort View Grounds', 799, '10:00', 'Organic colours, rain dance, DJ and dhol in a safe, family-friendly setup.', 7000],
  ['Winter Lights & Craft Fair', 'cat-festival', 'Pune', 'Expo Centre', 199, '11:00', 'Artisan crafts, lantern walks and cosy winter food in one place.', 5000],
  ['Book & Lit Fest', 'cat-festival', 'Kolkata', 'Literature Park', 249, '10:00', 'Author talks, poetry slams and a giant secondhand book fair.', 3000],
  // Sports (8)
  ['Premier T20 League – Opening Match', 'cat-sports', 'Ahmedabad', 'Grand Cricket Stadium', 699, '19:30', 'Season-opening T20 clash with fireworks and a live music opening ceremony.', 20000],
  ['City Marathon 2027', 'cat-sports', 'Mumbai', 'Seafront Start Line', 799, '05:00', 'Full, half and 10K categories with timing chips and finisher medals.', 12000],
  ['Pro Kabaddi Finals', 'cat-sports', 'Hyderabad', 'Indoor Sports Arena', 599, '20:00', 'Grand finale of the kabaddi season, with cheer squads and live commentary.', 6000],
  ['Inter-State Football Cup', 'cat-sports', 'Kolkata', 'Salt Park Stadium', 449, '17:00', 'Semi-final double-header between the region’s top football clubs.', 15000],
  ['Badminton Open Championship', 'cat-sports', 'Bengaluru', 'Racquet Complex', 399, '10:00', 'Three days of singles and doubles with national and international players.', 3500],
  ['Hockey Showdown', 'cat-sports', 'Bhubaneswar', 'Turf Stadium', 349, '18:00', 'Fast-paced international hockey fixture under floodlights.', 9000],
  ['Wrestling Dangal Night', 'cat-sports', 'Pune', 'Akhada Arena', 299, '18:30', 'Traditional mud and mat wrestling bouts featuring top regional pehlwans.', 4000],
  ['Cyclothon – Ride for Green', 'cat-sports', 'Surat', 'Riverfront Start Gate', 499, '06:00', '25 km and 50 km charity cycling event for all fitness levels.', 2500],
  // DJ Nights (8)
  ['Neon Pulse EDM Night', 'cat-dj', 'Mumbai', 'Skyline Club', 1299, '21:00', 'Laser lights, a massive LED wall and a headline DJ set until 3 AM.', 1800],
  ['Techno Underground', 'cat-dj', 'Bengaluru', 'The Warehouse', 999, '22:00', 'Dark, driving techno from three resident DJs in an industrial venue.', 1200],
  ['Beach Rave Sunset Session', 'cat-dj', 'Goa', 'Vagator Beach Stage', 2499, '16:00', 'Sunset-to-sunrise beach party with international and Indian DJs.', 6000],
  ['Bollywood x EDM Remix Party', 'cat-dj', 'Delhi', 'Terrace Lounge', 899, '21:30', 'Film hits remixed with big-room beats – dance till close.', 1500],
  ['Deep House Sundowner', 'cat-dj', 'Pune', 'Rooftop Garden', 749, '17:00', 'Chilled deep house on a rooftop as the sun goes down.', 700],
  ['Hip-Hop Cypher Night', 'cat-dj', 'Hyderabad', 'Loft 22', 599, '20:00', 'Open-mic cypher, DJ battle and breakdance showcase.', 900],
  ['New Year’s Eve Mega Bash', 'cat-dj', 'Ahmedabad', 'Grand Banquet Grounds', 1999, '20:00', 'Countdown party with three stages, dinner buffet and midnight fireworks.', 5000],
  ['Trance Odyssey', 'cat-dj', 'Surat', 'Aurora Club', 899, '22:00', 'Progressive and psy-trance journey across eight hours.', 1000],
  // Cultural Shows (7)
  ['Kathak & Bharatanatyam Gala', 'cat-cultural', 'Delhi', 'Cultural Hall', 499, '18:30', 'Two classical dance masters perform back-to-back in a rare joint recital.', 800],
  ['Ramleela Grand Theatre Show', 'cat-cultural', 'Varanasi', 'Ghat Open Stage', 249, '19:00', 'Spectacular retelling of the Ramayana with live music and costumes.', 3000],
  ['Rajasthani Folk Evening', 'cat-cultural', 'Jaipur', 'Haveli Courtyard', 599, '19:00', 'Ghoomar, kalbelia and puppet shows with a traditional Rajasthani dinner.', 600],
  ['Marathi Natya Sangeet Night', 'cat-cultural', 'Pune', 'Cultural Auditorium', 399, '18:00', 'Musical theatre favourites performed by veteran stage artists.', 700],
  ['Durga Puja Cultural Meet', 'cat-cultural', 'Kolkata', 'Pandal Park', 199, '17:00', 'Dhunuchi dance, folk songs and a pandal-hopping cultural trail.', 5000],
  ['Kathakali & Mohiniyattam Evening', 'cat-cultural', 'Kochi', 'Temple Arts Centre', 449, '18:30', 'Traditional Kerala dance-drama with live percussion.', 500],
  ['Gujarati Lok Dayro', 'cat-cultural', 'Rajkot', 'Lok Kala Mandap', 349, '19:30', 'Authentic Gujarati folk storytelling, bhajans and humour.', 1500],
  // Comedy (5)
  ['Stand-Up Saturday Special', 'cat-comedy', 'Mumbai', 'Laugh Factory Club', 699, '20:00', 'Five of the city’s sharpest stand-up comics in one headline show.', 400],
  ['Improv Jam Night', 'cat-comedy', 'Bengaluru', 'The Black Box', 449, '19:30', 'Unscripted comedy built from your suggestions – come ready to play along.', 250],
  ['Gujarati Hasya Sammelan', 'cat-comedy', 'Vadodara', 'City Convention Hall', 299, '18:30', 'A hilarious evening of humorous poetry and satire in Gujarati.', 900],
  ['Roast Battle Live', 'cat-comedy', 'Delhi', 'Basement Comedy Club', 599, '21:00', 'Comics trade sharp-tongued insults in a head-to-head roast format.', 300],
  ['Family Comedy Matinee', 'cat-comedy', 'Surat', 'Riverside Auditorium', 349, '15:00', 'Clean, kid-friendly comedy with magic and mimicry for the whole family.', 1000],
  // Workshops & Tech (5)
  ['React & Frontend Dev Summit', 'cat-workshop', 'Surat', 'Tech Hub Convention Centre', 999, '09:30', 'Talks and hands-on sessions on React, performance and design systems.', 600],
  ['AI & Machine Learning Bootcamp', 'cat-workshop', 'Bengaluru', 'Innovation Campus', 1499, '09:00', 'Full-day practical bootcamp: build and deploy your first ML model.', 400],
  ['Startup Pitch & Networking Night', 'cat-workshop', 'Ahmedabad', 'Founders’ Lounge', 399, '17:30', 'Ten early-stage startups pitch to investors, followed by open networking.', 350],
  ['Photography Masterclass', 'cat-workshop', 'Goa', 'Studio by the Sea', 1299, '10:00', 'Light, composition and storytelling with an award-winning photographer, plus a field walk.', 80],
  ['Pottery & Art Weekend Workshop', 'cat-workshop', 'Jaipur', 'Creative Art House', 899, '11:00', 'Hands-on pottery wheel and blue-pottery painting – materials included.', 60],
]

// deterministic PRNG so the seed is repeatable
let s = 42
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
const pick = (a) => a[Math.floor(rnd() * a.length)]

const start = new Date('2026-10-18T00:00:00Z')
const events = rows.map((r, i) => {
  const d = new Date(start.getTime() + (i * 3 + Math.floor(rnd() * 3)) * 86400000)
  return {
    id: `evt-${String(i + 1).padStart(3, '0')}`,
    title: r[0],
    categoryId: r[1],
    city: r[2],
    venue: r[3],
    date: d.toISOString().slice(0, 10),
    time: r[5],
    basePrice: r[4],
    capacity: r[7],
    description: r[6],
    active: i % 17 !== 16, // a few inactive, for the demo
    createdAt: '2026-09-20T10:00:00.000Z',
  }
})

const names = ['Aarav Shah', 'Diya Patel', 'Vihaan Mehta', 'Anaya Desai', 'Reyansh Joshi', 'Ishita Rao', 'Kabir Singh', 'Meera Nair']
const users = [
  { id: 'usr-demo', name: 'Demo User', email: 'user@eventra.com', phone: '9876543210', passwordHash: sha256('user123'), createdAt: '2026-09-25T09:00:00.000Z' },
  ...names.map((n, i) => ({
    id: `usr-${i + 1}`,
    name: n,
    email: `${n.toLowerCase().replace(/ /g, '.')}@example.com`,
    phone: `98${String(10000000 + Math.floor(rnd() * 89999999))}`,
    passwordHash: sha256('password123'),
    createdAt: new Date(Date.parse('2026-09-26T09:00:00Z') + i * 86400000).toISOString(),
  })),
]

const activeEvents = events.filter((e) => e.active)
const bookings = []
for (let i = 0; i < 26; i++) {
  const ev = pick(activeEvents.slice(0, 30))
  const pass = pick(passes)
  const user = pick(users)
  const qty = 1 + Math.floor(rnd() * 4)
  const unit = Math.round(ev.basePrice * pass.multiplier)
  const status = pick(['confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled'])
  bookings.push({
    id: `bkg-${i + 1}`,
    ref: `EVT-${(100000 + Math.floor(rnd() * 800000)).toString(36).toUpperCase()}${i + 10}`,
    userId: user.id, eventId: ev.id, passId: pass.id, qty, unitPrice: unit, total: unit * qty, status,
    createdAt: new Date(Date.parse('2026-10-01T08:00:00Z') + i * 6 * 3600000).toISOString(),
  })
}

const loginLogs = []
for (let i = 0; i < 40; i++) {
  const u = pick(users)
  loginLogs.push({
    id: `log-${i + 1}`, role: 'user', userId: u.id, name: u.name, email: u.email,
    at: new Date(Date.parse('2026-10-01T06:00:00Z') + i * 5 * 3600000).toISOString(),
  })
}

const queries = [
  { id: 'q-1', name: 'Rohan Kapoor', email: 'rohan@example.com', subject: 'Refund policy', message: 'If an event gets cancelled, how long does a refund take?', status: 'new', createdAt: '2026-10-05T10:20:00.000Z' },
  { id: 'q-2', name: 'Sneha Iyer', email: 'sneha@example.com', subject: 'Group booking', message: 'We are a group of 25 – is there a discount for bulk bookings?', status: 'new', createdAt: '2026-10-06T14:05:00.000Z' },
  { id: 'q-3', name: 'Amit Verma', email: 'amit@example.com', subject: 'Ticket not received', message: 'I booked yesterday but cannot find my QR code.', status: 'resolved', createdAt: '2026-10-02T09:40:00.000Z' },
]

const db = {
  version: 1,
  admins: [{ id: 'adm-1', username: 'admin', name: 'Administrator', passwordHash: sha256('admin123') }],
  categories, passes, events, users, bookings, loginLogs, queries,
}
fs.writeFileSync(new URL('../public/data/db.json', import.meta.url), JSON.stringify(db, null, 2))
console.log(`db.json written: ${events.length} events, ${users.length} users, ${bookings.length} bookings`)
