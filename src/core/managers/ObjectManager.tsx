import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { DestructibleObject } from '../objects/DestructibleObject';
import { gameStore } from '../store/GameStore';
import { soundManager } from '../managers/SoundManager';
// import { ParticleManager } ... No, used via global for now to avoid Context overhead for this prototype

interface GameObject {
    id: string;
    position: [number, number, number];
    type: 'glass' | 'ice';
}

const SPAWN_DISTANCE = 50;
const SPAWN_INTERVAL = 10;

export const ObjectManager = () => {
    const [objects, setObjects] = useState<GameObject[]>([]);
    const lastSpawnZ = useRef(0);
    const combo = useRef(0);
    const lastHitTime = useRef(0);

    // Initial Spawn
    useEffect(() => {
        const initialObjs: GameObject[] = [];
        for (let i = 1; i < 5; i++) {
            initialObjs.push(createObject(-i * SPAWN_INTERVAL));
        }
        setObjects(initialObjs);
        lastSpawnZ.current = -5 * SPAWN_INTERVAL;
    }, []);

    useFrame((state) => {
        // 1. Spawning
        const playerZ = gameStore.playerZ;
        if (playerZ < lastSpawnZ.current + SPAWN_DISTANCE) {
            const newZ = lastSpawnZ.current - SPAWN_INTERVAL;
            const newObj = createObject(newZ);
            setObjects(prev => [...prev, newObj]);
            lastSpawnZ.current = newZ;
        }

        // 2. Cleanup 
        setObjects(prev => prev.filter(obj => obj.position[2] < playerZ + 5));

        // 3. Combo Decay
        if (state.clock.elapsedTime - lastHitTime.current > 2.0 && combo.current > 0) {
            combo.current = 0; // Reset combo if too slow
            // console.log("Combo Reset");
        }
    });

    const createObject = (z: number): GameObject => {
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        return {
            id: Math.random().toString(36).substr(2, 9),
            position: [lane * 2, 1, z],
            type: Math.random() > 0.5 ? 'glass' : 'ice'
        };
    };

    const handleHit = (id: string) => {
        // Find object for type and pos info
        const obj = objects.find(o => o.id === id);
        if (!obj) return;

        // Visuals: Remove object
        setObjects(prev => prev.filter(o => o.id !== id));

        // Logic: Score & Combo
        combo.current += 1;
        lastHitTime.current = performance.now() / 1000; // approximation or use existing clock ref if passed
        // We'll just set it to current time roughly. useFrame uses state.clock.elapsedTime, 
        // but performance.now is fine if we sync logic. Let's use Date.now() / 1000 for simplicity or assume call happens in frame.
        // Better: Inside handleHit, we don't have frame state.

        gameStore.score += 100 * (1 + Math.floor(combo.current / 5)); // Bonus

        // Audio
        // Pitch increases with combo, capped at 2.0
        const pitch = Math.min(1.0 + (combo.current * 0.1), 2.0);

        if (obj.type === 'glass') {
            soundManager.playGlassBreak(pitch);
            // Particles
            if ((window as any).spawnShatterParticles) {
                (window as any).spawnShatterParticles(obj.position, '#aaddff', 15); // Blue-ish
            }
        } else {
            soundManager.playIceBreak(pitch);
            if ((window as any).spawnShatterParticles) {
                (window as any).spawnShatterParticles(obj.position, '#ffffff', 20); // White
            }
        }
    };

    return (
        <group>
            {objects.map(obj => (
                <DestructibleObject
                    key={obj.id}
                    id={obj.id}
                    position={obj.position}
                    type={obj.type}
                    onHit={handleHit}
                />
            ))}
        </group>
    );
};
