import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'; // Import i18n configuration
import App from './App.tsx'

import { ProfileProvider } from './context/ProfileContext'

// Dynamically support both subfolder (/hypertrophyracker) and root subdomain (hypertrophyracker.alexismartyniuk.com.ar)
const isSubfolder = typeof window !== 'undefined' && window.location.pathname.startsWith('/hypertrophyracker');
const basename = isSubfolder ? '/hypertrophyracker' : undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>,
)
