// Simple mutable store for high-frequency updates (avoiding React state in useFrame)
export const gameStore = {
    score: 0,
    highScore: parseInt(localStorage.getItem('highScore') || '0'),
    combo: 0,
    speed: 0.5,
    isGameOver: false,
    playerZ: 0,
    playerLane: 0,
    isPaused: false,
    isFever: false,
    timeScale: 1.0,
    life: 3,
    maxLife: 3,
    isAttacking: false,
    lastDamageTime: -100
};

export const resetGame = () => {
    gameStore.score = 0;
    gameStore.combo = 0;
    gameStore.speed = 0.5;
    gameStore.isGameOver = false;
    gameStore.playerZ = 0;
    gameStore.playerLane = 0;
    gameStore.isPaused = false;
    gameStore.isFever = false;
    gameStore.timeScale = 1.0;
    gameStore.life = 3;
    gameStore.isAttacking = false;
    gameStore.lastDamageTime = -100;
    notifyStoreUpdate();
};

// Listeners for events (like score updates) to sync with React UI
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeToStore = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const notifyStoreUpdate = () => {
    listeners.forEach(l => l());
};
