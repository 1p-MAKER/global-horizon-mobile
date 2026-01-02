// Simple mutable store for high-frequency updates (avoiding React state in useFrame)
export const gameStore = {
    score: 0,
    highScore: parseInt(localStorage.getItem('highScore') || '0'),
    combo: 0,
    speed: 10,
    isGameOver: false,
    playerZ: 0,
    playerLane: 0,
    isPaused: false,
    isFever: false,
    timeScale: 1.0,
    life: 3,
    maxLife: 3,
    isAttacking: false,
    lastDamageTime: -100,
    isDamaged: false,

    takeDamage(now: number) {
        if (this.isGameOver || this.isFever) return false;

        const timeSinceLast = now - this.lastDamageTime;
        if (timeSinceLast > 1.0) {
            this.life -= 1;
            this.lastDamageTime = now;
            this.combo = 0;
            this.isFever = false;
            this.isDamaged = true;

            if (this.life <= 0) {
                this.isGameOver = true;
            }

            // Trigger UI update
            notifyStoreUpdate();

            // Auto-reset damage effect
            setTimeout(() => {
                this.isDamaged = false;
                notifyStoreUpdate();
            }, 200);

            return true;
        }
        return false;
    }
};

export const resetGame = () => {
    gameStore.score = 0;
    gameStore.combo = 0;
    gameStore.speed = 10;
    gameStore.isGameOver = false;
    gameStore.playerZ = 0;
    gameStore.playerLane = 0;
    gameStore.isPaused = false;
    gameStore.isFever = false;
    gameStore.timeScale = 1.0;
    gameStore.life = 3;
    gameStore.isAttacking = false;
    gameStore.lastDamageTime = -100;
    gameStore.isDamaged = false;
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
