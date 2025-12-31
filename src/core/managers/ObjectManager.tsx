import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { DestructibleObject } from '../objects/DestructibleObject';
import { gameStore, notifyStoreUpdate } from '../store/GameStore';
import { soundManager } from '../managers/SoundManager';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
        if (state.clock.elapsedTime - lastHitTime.current > 2.0 && gameStore.combo > 0) {
            gameStore.combo = 0; // Reset combo if too slow
            notifyStoreUpdate();
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
        const obj = objects.find(o => o.id === id);
        if (!obj) return;

        setObjects(prev => prev.filter(o => o.id !== id));

        gameStore.combo += 1;
        lastHitTime.current = performance.now() / 1000;

        gameStore.score += 100 * (1 + Math.floor(gameStore.combo / 5));

        // Increase speed slightly
        gameStore.speed += 0.05;

        notifyStoreUpdate();

        // Haptics
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

        const pitch = Math.min(1.0 + (gameStore.combo * 0.1), 2.0);

        if (obj.type === 'glass') {
            soundManager.playGlassBreak(pitch);
            if ((window as any).spawnShatterParticles) {
                (window as any).spawnShatterParticles(obj.position, '#aaddff', 15);
            }
        } else {
            soundManager.playIceBreak(pitch);
            if ((window as any).spawnShatterParticles) {
                (window as any).spawnShatterParticles(obj.position, '#ffffff', 20);
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
