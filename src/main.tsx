import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Device } from '@capacitor/device'
import './index.css'
import App from './App.tsx'
import { initI18n } from './i18n/config.ts'

const startApp = async () => {
  let language = 'en';
  try {
    const info = await Device.getLanguageCode();
    // info.value returns something like "en-US" or "ja"
    if (info.value) {
      language = info.value.split('-')[0];
    }
  } catch (e) {
    console.warn('Failed to get device language, falling back to browser language or English', e);
    // Fallback to browser language if Capacitor fails (e.g. in older web view or plain browser)
    language = navigator.language.split('-')[0];
  }

  initI18n(language);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
};

startApp();
