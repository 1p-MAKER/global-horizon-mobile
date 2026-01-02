import { useTranslation } from 'react-i18next';
import './App.css'
import { GameScene } from './scenes/GameScene';
import { useState, useEffect } from 'react';
import { HUD } from './components/ui/HUD';
import { Settings } from './components/ui/Settings';
import { Ranking } from './components/ui/Ranking';
import { gameStore, subscribeToStore } from './core/store/GameStore';

function App() {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    return subscribeToStore(() => {
      // Game Over Sync
      if (gameStore.isGameOver !== isGameOver) {
        setIsGameOver(gameStore.isGameOver);
        if (gameStore.isGameOver) {
          import('./core/managers/SoundManager').then(m => m.soundManager.stopBGM());

          // Save Score if it's high enough
          const score = gameStore.score;
          if (score > 0) {
            const saved = localStorage.getItem('highScores');
            let scores = saved ? JSON.parse(saved) : [];
            scores.push({ score, date: Date.now() });
            scores.sort((a: any, b: any) => b.score - a.score);
            scores = scores.slice(0, 5); // Keep top 5
            localStorage.setItem('highScores', JSON.stringify(scores));
          }
        }
      }

      // Pause Sync
      if (gameStore.isPaused !== isPaused) {
        setIsPaused(gameStore.isPaused);
      }

      // Sync speed to BGM tempo
      if (isPlaying && !gameStore.isGameOver && !gameStore.isPaused) {
        // Default speed 10 = rate 1.0. Speed 20 = rate 1.2? 
        // Let's scale slightly: 1.0 + (speed - 10) * 0.02
        const rate = 1.0 + (gameStore.speed - 10) * 0.02;
        // Slow mo effect
        const finalRate = rate * gameStore.timeScale;
        import('./core/managers/SoundManager').then(m => m.soundManager.setBGMPlaybackRate(finalRate));
      }
    });
  }, [isGameOver, isPaused, isPlaying]);

  const togglePause = () => {
    gameStore.isPaused = !gameStore.isPaused;
    setIsPaused(gameStore.isPaused);
    if (gameStore.isPaused) {
      import('./core/managers/SoundManager').then(m => m.soundManager.setBGMPlaybackRate(0));
    }
  };

  const startGame = () => {
    gameStore.score = 0;
    gameStore.combo = 0;
    gameStore.isFever = false;
    gameStore.isPaused = false;
    gameStore.speed = 10;
    gameStore.playerZ = 0;
    gameStore.isGameOver = false;
    gameStore.life = 3;
    gameStore.lastDamageTime = -100;

    // Remount strategy: set playing to false then true
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => {
        setIsPlaying(true);
        setIsGameOver(false);
        import('./core/managers/SoundManager').then(m => m.soundManager.playBGM());
      }, 10);
    } else {
      setIsPlaying(true);
      setIsGameOver(false);
      import('./core/managers/SoundManager').then(m => m.soundManager.playBGM());
    }
  };

  // Stylish Start Screen
  if (!isPlaying) {
    return (
      <>
        <div className="ui-overlay" onClick={startGame}>
          <button
            className="ranking-trophy-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowRanking(true);
            }}
          >
            🏆
          </button>

          <button
            className="settings-gear-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(true);
            }}
          >
            ⚙️
          </button>

          <div className="background-decor-1"></div>
          <div className="background-decor-2"></div>

          <div className="glass-container">
            <div className="logo-glitch-container">
              <h1 className="main-title">SHATTER RUSH</h1>
              <div className="title-glow"></div>
            </div>
            <p className="subtitle">ASMR DESTRUCTION ODYSSEY</p>
          </div>

          <div className="interactive-prompt">
            <div className="pulse-circle"></div>
            <span className="prompt-text">PRESS TO SHATTER</span>
          </div>
        </div>

        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        {showRanking && <Ranking onClose={() => setShowRanking(false)} />}
      </>
    )
  }

  const goHome = () => {
    setIsPlaying(false);
    setIsGameOver(false);
    gameStore.isPaused = false;
    import('./core/managers/SoundManager').then(m => m.soundManager.stopBGM());
  };

  // Game Running
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameScene />
      <HUD />

      {/* Pause Button */}
      {!isGameOver && (
        <button className="pause-button" onClick={togglePause}>
          <div className="pause-icon">
            <div className="pause-bar"></div>
            <div className="pause-bar"></div>
          </div>
        </button>
      )}

      {/* Pause Modal */}
      {isPaused && (
        <div className="modal-overlay">
          <div className="result-card">
            <h2>PAUSED</h2>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '2rem' }}>
              <button onClick={goHome} className="secondary-button">
                HOME
              </button>
              <button onClick={togglePause} className="start-button">
                RESUME
              </button>
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="modal-overlay game-over-modal">
          <div className="result-card">
            <h2>GAME OVER</h2>
            <div style={{ fontSize: '2rem', margin: '20px 0' }}>
              {t('score')}: {gameStore.score}
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button onClick={goHome} className="secondary-button">
                HOME
              </button>
              <button onClick={startGame} className="start-button">
                RETRY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
