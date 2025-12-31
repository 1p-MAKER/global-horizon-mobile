import { useTranslation } from 'react-i18next';
import './App.css'
import { GameScene } from './scenes/GameScene';
import { useState, useEffect } from 'react';
import { HUD } from './components/ui/HUD';
import { gameStore, subscribeToStore } from './core/store/GameStore';

function App() {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    return subscribeToStore(() => {
      if (gameStore.isGameOver !== isGameOver) {
        setIsGameOver(gameStore.isGameOver);
      }
    });
  }, [isGameOver]);

  const startGame = () => {
    gameStore.score = 0;
    gameStore.combo = 0;
    gameStore.speed = 10;
    gameStore.playerZ = 0;
    gameStore.isGameOver = false;

    // Remount strategy: set playing to false then true
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => {
        setIsPlaying(true);
        setIsGameOver(false);
      }, 10);
    } else {
      setIsPlaying(true);
      setIsGameOver(false);
    }
  };

  // Simple Start Screen Overlay
  if (!isPlaying) {
    return (
      <div className="ui-overlay">
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', letterSpacing: '0.1em' }}>SHATTER RUSH</h1>
        <div className="card">
          <button onClick={startGame} className="start-button">
            {t('start')}
          </button>
        </div>
      </div>
    )
  }

  // Game Running
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameScene />
      <HUD />

      {isGameOver && (
        <div className="modal-overlay">
          <div className="result-card">
            <h2>GAME OVER</h2>
            <div style={{ fontSize: '2rem', margin: '20px 0' }}>
              {t('score')}: {gameStore.score}
            </div>
            <button onClick={startGame} className="start-button">
              RETRY
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
