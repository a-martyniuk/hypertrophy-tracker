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

// Auto-migrate any direct path navigation (e.g. /hypertrophyracker/share?data=... or /share?data=...) to clean hash navigation
if (typeof window !== 'undefined' && !window.location.hash) {
  const path = window.location.pathname;
  const search = window.location.search || '';
  const cleanPath = path.replace(/^\/hypertrophyracker/, '').replace(/\/index\.html$/, '').replace(/\/+$/, '');
  const isSubFolder = path.startsWith('/hypertrophyracker');
  const baseHash = isSubFolder ? '/hypertrophyracker/#' : '/#';
  
  if (cleanPath && cleanPath !== '/') {
    window.location.replace(baseHash + cleanPath + search);
  } else if (search && search.includes('data=')) {
    window.location.replace(baseHash + '/share' + search);
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
