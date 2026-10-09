import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { DBProvider } from './lib/db'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DBProvider>
      <App />
    </DBProvider>
  </StrictMode>,
)
