import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import './i18n'; // Import i18n configuration
import App from './App.tsx'

import { ProfileProvider } from './context/ProfileContext'

// Auto-migrate any direct path navigation (e.g. /hypertrophyracker/dashboard) to clean hash navigation
if (typeof window !== 'undefined' && window.location.pathname.startsWith('/hypertrophyracker/') && window.location.pathname !== '/hypertrophyracker/' && !window.location.hash) {
  const subRoute = window.location.pathname.replace('/hypertrophyracker', '');
  if (subRoute && subRoute !== '/') {
    window.location.replace('/hypertrophyracker/#' + subRoute);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </HashRouter>
  </StrictMode>,
)
