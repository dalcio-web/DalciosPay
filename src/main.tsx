import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSupabase } from './lib/supabase.ts';

// Initialize Supabase config dynamically from the server before mounting the app
initSupabase().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

// Unregister any active Service Worker and clear caches to disable static offline persistence
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('[PWA Cleanup] Unregistered existing service worker.');
        }
      });
    }
  }).catch((err) => {
    console.warn('[PWA Cleanup] Error fetching service worker registrations:', err);
  });
}

if ('caches' in window) {
  caches.keys().then((names) => {
    for (const name of names) {
      caches.delete(name).then((success) => {
        if (success) {
          console.log('[PWA Cleanup] Deleted cache:', name);
        }
      });
    }
  }).catch((err) => {
    console.warn('[PWA Cleanup] Error clearing caches:', err);
  });
}
