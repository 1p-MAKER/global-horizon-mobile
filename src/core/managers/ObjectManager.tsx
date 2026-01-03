import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { DestructibleObject } from '../objects/DestructibleObject';
import { gameStore, notifyStoreUpdate } from '../store/GameStore';
import { soundManager } from '../managers/SoundManager';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface GameObject {
    id: string;
    position: [number, number, number];
    type: 'glass' | 'ice';
    scale: number;
    color?: string;
}

const SPAWN_DISTANCE = 50;
const SPAWN_INTERVAL = 12;
const FEVER_COLORS = ['#ff00ff', '#00ffff', '#ffff00', '#ff0055', '#55ff00'];

export const ObjectManager = () => {
    const [objects, setObjects] = useState<GameObject[]>([]);
    const lastSpawnZ = useRef(0);
    const lastHitTime = useRef(0);
    const processedMisses = useRef(new Set<string>());

    // Initial Spawn
    useEffect(() => {
        const initialObjs: GameObject[] = [];
        for (let i = 1; i < 5; i++) {
            initialObjs.push(createObject(-i * SPAWN_INTERVAL));
        }
        setObjects(initialObjs);
        lastSpawnZ.current = -5 * SPAWN_INTERVAL;
        processedMisses.current.clear();
    }, []);

    useFrame((state, _delta) => {
        if (gameStore.isPaused) return;

        // Reset guards on game start/loop
        if (gameStore.playerZ > -1 && processedMisses.current.size > 0) {
            processedMisses.current.clear();
        }

        const playerZ = gameStore.playerZ;
        const now = state.clock.elapsedTime;

        // 1. Spawning Logic
        if (playerZ < lastSpawnZ.current + SPAWN_DISTANCE) {
            const isFeverValid = gameStore.isFever && gameStore.combo >= 10;
            const interval = isFeverValid ? SPAWN_INTERVAL * 0.5 : SPAWN_INTERVAL;
            const newZ = lastSpawnZ.current - interval;
            const newObj = createObject(newZ);
            setObjects(prev => [...prev, newObj]);
            lastSpawnZ.current = newZ;
        }

        // 2. Main Object Loop (Movement, Collision, Cleanup)
        setObjects(prev => {
            const nextObjects: GameObject[] = [];
            const cleanupThresholdZ = playerZ + 5; // Clean up far behind

            for (const obj of prev) {
                // A. Cleanup
                if (obj.position[2] > cleanupThresholdZ) {
                    continue;
                }

                // Interaction Logic
                const isProcessed = processedMisses.current.has(obj.id);

                if (!isProcessed) {
                    const distanceZ = Math.abs(obj.position[2] - playerZ);
                    const isSameLane = Math.abs(obj.position[0] - gameStore.playerLane * 2) < 0.5;

                    // Scale-Aware Collision Threshold
                    const collisionThreshold = Math.max(1.0, 0.5 + (0.5 * obj.scale));

                    // B. Collision (Priority 1)
                    if (isSameLane && distanceZ < collisionThreshold) {
                        if (gameStore.isAttacking) {
                            // CASE: ATTACK (Success) -> DESTROY
                            triggerDestructionEffects(obj, now);
                            processedMisses.current.add(obj.id);
                            continue; // Remove from nextObjects (Instant visual destruction)
                        } else {
                            // CASE: CRASH (Failure) -> DAMAGE
                            const damaged = gameStore.takeDamage(now);
                            if (damaged) {
                                processedMisses.current.add(obj.id);
                            }
                        }
                    }

                    // C. Miss (Priority 2)
                    else if (obj.position[2] > playerZ + 2) {
                        // CASE: SAFE MISS (Combo Reset Only)
                        // If Missed (valid or invalid lane), we just reset combo if not fever.
                        // Strictly NO DAMAGE.
                        if (!gameStore.isFever && gameStore.combo > 0) {
                            gameStore.combo = 0;
                            gameStore.isFever = false;
                            notifyStoreUpdate();
                        }
                        processedMisses.current.add(obj.id);
                    }
                }

                nextObjects.push(obj);
            }
            return nextObjects;
        });

        // 3. Combo Decay (Time-based reset if idle)
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

    const triggerDestructionEffects = (obj: GameObject, now: number) => {
        gameStore.combo += 1;
        lastHitTime.current = now;

        if (gameStore.combo >= 10 && !gameStore.isFever) {
            gameStore.isFever = true;
            Haptics.notification({ type: ImpactStyle.Heavy as any }).catch(() => { });
        }

        gameStore.score += 100 * (gameStore.isFever ? 2 : 1) * (1 + Math.floor(gameStore.combo / 5));

        const acceleration = 0.05 * (gameStore.isFever ? 2.5 : 1);
        gameStore.speed = Math.min(gameStore.speed + acceleration, 25.0);

        if (gameStore.combo % 50 === 0 && gameStore.life < gameStore.maxLife) {
            gameStore.life += 1;
            Haptics.notification({ type: NotificationType.Success }).catch(() => { });
        }

        notifyStoreUpdate();

        Haptics.impact({ style: obj.scale > 1.5 ? ImpactStyle.Heavy : ImpactStyle.Medium }).catch(() => { });

        const pitch = Math.min(1.0 + (gameStore.combo * 0.1), 3.0);
        const particleCount = (obj.scale > 1.5 ? 50 : 15) * (gameStore.isFever ? 2 : 1);
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
                    scale={obj.scale}
                    color={obj.color}
                />
            ))}
        </group>
    );
};
