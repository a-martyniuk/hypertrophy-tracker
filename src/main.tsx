import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import './i18n'; // Import i18n configuration
import App from './App.tsx'

import { ProfileProvider } from './context/ProfileContext'
import { initBackgroundSyncListener } from './services/offlineSyncQueue'

// Initialize offline background sync listener for Firestore connectivity recovery
initBackgroundSyncListener();

// Auto-migrate any direct path navigation (e.g. /hypertrophyracker/share?data=... or /hypertrophyracker/dashboard) to clean hash navigation
if (typeof window !== 'undefined' && !window.location.hash) {
  const path = window.location.pathname;
  const search = window.location.search || '';
  
  if (path.startsWith('/hypertrophyracker')) {
    const subRoute = path.replace(/^\/hypertrophyracker/, '').replace(/\/+$/, '');
    if (subRoute && subRoute !== '/') {
      window.location.replace('/hypertrophyracker/#' + subRoute + search);
    } else if (search && search.includes('data=')) {
      window.location.replace('/hypertrophyracker/#/share' + search);
    }
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
