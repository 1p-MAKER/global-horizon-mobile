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
    scale: number;
    color?: string;
}

const SPAWN_DISTANCE = 50;
const SPAWN_INTERVAL = 10;
const FEVER_COLORS = ['#ff00ff', '#00ffff', '#ffff00', '#ff0055', '#55ff00'];

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

    useFrame((state, _delta) => {
        if (gameStore.isPaused) return;

        // 1. Spawning
        const playerZ = gameStore.playerZ;
        if (playerZ < lastSpawnZ.current + SPAWN_DISTANCE) {
            // Triple density during fever (interval / 3)
            // Safety Check: Ensure combo is actually high enough for fever density
            const isFeverValid = gameStore.isFever && gameStore.combo >= 10;
            const interval = isFeverValid ? SPAWN_INTERVAL * 0.33 : SPAWN_INTERVAL;
            const newZ = lastSpawnZ.current - interval;
            const newObj = createObject(newZ);
            setObjects(prev => [...prev, newObj]);
            lastSpawnZ.current = newZ;
        }

        // 2. Cleanup 
        setObjects(prev => prev.filter(obj => obj.position[2] < playerZ + 5));

        // 3. Combo Decay
        if (state.clock.elapsedTime - lastHitTime.current > 2.0 && gameStore.combo > 0) {
            gameStore.combo = 0;
            gameStore.isFever = false;
            notifyStoreUpdate();
        }

    });

    const createObject = (z: number): GameObject => {
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const isLarge = Math.random() > 0.8;

        // Random color during Fever Mode
        let color: string | undefined;
        if (gameStore.isFever) {
            color = FEVER_COLORS[Math.floor(Math.random() * FEVER_COLORS.length)];
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            position: [lane * 2, isLarge ? 2 : 1, z],
            type: Math.random() > 0.5 ? 'glass' : 'ice',
            scale: isLarge ? 2 : 1,
            color
        };
    };

    const handleHit = (id: string) => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return;

        setObjects(prev => prev.filter(o => o.id !== id));

        gameStore.combo += 1;
        lastHitTime.current = performance.now() / 1000;

        // Fever check
        if (gameStore.combo >= 10 && !gameStore.isFever) {
            gameStore.isFever = true;
            Haptics.notification({ type: ImpactStyle.Heavy as any }).catch(() => { });
        }

        gameStore.score += 100 * (gameStore.isFever ? 2 : 1) * (1 + Math.floor(gameStore.combo / 5));



        // Speed increase
        // Double acceleration during fever (2.5x base rate)
        gameStore.speed += 0.05 * (gameStore.isFever ? 2.5 : 1);

        notifyStoreUpdate();

        // Haptics
        Haptics.impact({ style: obj.scale > 1.5 ? ImpactStyle.Heavy : ImpactStyle.Medium }).catch(() => { });

        const pitch = Math.min(1.0 + (gameStore.combo * 0.1), 3.0);

        const particleCount = (obj.scale > 1.5 ? 50 : 15) * (gameStore.isFever ? 2 : 1);

        // Use object color or fallback
        const particleColor = obj.color || (obj.type === 'glass' ? '#aaddff' : '#ffffff');

        if (obj.type === 'glass') {
            soundManager.playGlassBreak(pitch);
        } else {
            soundManager.playIceBreak(pitch);
        }

        if ((window as any).spawnShatterParticles) {
            (window as any).spawnShatterParticles(obj.position, particleColor, particleCount);
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
                    scale={obj.scale}
                    color={obj.color}
                />
            ))}
        </group>
    );
};
