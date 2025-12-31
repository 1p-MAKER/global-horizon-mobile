import { useTranslation } from 'react-i18next';
import './App.css'
import { GameScene } from './scenes/GameScene';
import { useState } from 'react';

function App() {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  // Simple Start Screen Overlay
  if (!isPlaying) {
    return (
      <div className="ui-overlay">
        <h1>{t('app.title')}</h1>
        <div className="card">
          <button onClick={() => setIsPlaying(true)} style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}>
            {t('start')}
          </button>
        </div>
      </div>
    )
  }

  // Game Running
  return (
    <>
      <GameScene />
      {/* UI Overlay for Score/Distance can go here */}
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none' }}>
        {/* Placeholder UI */}
      </div>
    </>
  )
}

export default App
