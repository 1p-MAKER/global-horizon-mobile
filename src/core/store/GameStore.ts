// Simple mutable store for high-frequency updates (avoiding React state in useFrame)
export const gameStore = {
    playerZ: 0,
    playerLane: 0,
    isAttacking: false, // True for a frame or few when tapping
    score: 0,
    combo: 0,
    speed: 10, // Units per second
    isGameOver: false,
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
