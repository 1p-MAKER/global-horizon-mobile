import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { DestructibleObject } from '../objects/DestructibleObject';
import { gameStore } from '../store/GameStore';

interface GameObject {
    id: string;
    position: [number, number, number];
    type: 'glass' | 'ice';
}

const SPAWN_DISTANCE = 50;
const SPAWN_INTERVAL = 10; // Distance between objects

export const ObjectManager = () => {
    const [objects, setObjects] = useState<GameObject[]>([]);
    const lastSpawnZ = useRef(0);

    // Initial Spawn
    useEffect(() => {
        const initialObjs: GameObject[] = [];
        for (let i = 1; i < 5; i++) {
            initialObjs.push(createObject(-i * SPAWN_INTERVAL));
        }
        setObjects(initialObjs);
        lastSpawnZ.current = -5 * SPAWN_INTERVAL;
    }, []);

    useFrame(() => {
        // 1. Spawning
        const playerZ = gameStore.playerZ;
        // If player has moved enough towards the last spawn point
        // Player moves -Z. 
        if (playerZ < lastSpawnZ.current + SPAWN_DISTANCE) {
            // Spawn new object further ahead
            const newZ = lastSpawnZ.current - SPAWN_INTERVAL;
            const newObj = createObject(newZ);
            setObjects(prev => [...prev, newObj]);
            lastSpawnZ.current = newZ;
        }

        // 2. Cleanup (Remove objects behind player)
        // objects behind player are those with z > playerZ + some buffer
        setObjects(prev => prev.filter(obj => obj.position[2] < playerZ + 5));
    });

    const createObject = (z: number): GameObject => {
        // Random lane: -1, 0, 1
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        return {
            id: Math.random().toString(36).substr(2, 9),
            position: [lane * 2, 1, z], // Y is 1 (center of height 2)
            type: Math.random() > 0.5 ? 'glass' : 'ice'
        };
    };

    const handleHit = (id: string) => {
        // Remove object
        setObjects(prev => prev.filter(o => o.id !== id));
        // Update Score
        gameStore.score += 100;
        // Play Sound / Particles (placeholder)
        console.log("Shattered! Score:", gameStore.score);
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
