import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { gameStore } from '../store/GameStore';
import * as THREE from 'three';

interface DestructibleObjectProps {
    id: string;
    position: [number, number, number];
    type: 'glass' | 'ice';
    scale?: number;
    onHit: (id: string) => void;
}

export const DestructibleObject = ({ id, position, type, scale = 1, onHit }: DestructibleObjectProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialColor = type === 'glass' ? '#aaddff' : '#ffffff';

    useFrame(() => {
        if (!meshRef.current) return;

        const playerZ = gameStore.playerZ;
        const myZ = position[2];
        const myLane = Math.round(position[0] / 2);

        // Adjust collision window for scale
        const collisionZ = 1.0 * scale;

        if (!gameStore.isGameOver && Math.abs(playerZ - myZ) < collisionZ && gameStore.playerLane === myLane) {
            if (gameStore.isAttacking) {
                onHit(id);
            } else if (playerZ < myZ) {
                gameStore.isGameOver = true;
                import('../store/GameStore').then(m => m.notifyStoreUpdate());
            }
        }
    });

    const materialProxy = useMemo(() => (
        <meshPhysicalMaterial
            color={gameStore.isFever ? (type === 'glass' ? '#ff00ff' : '#ffff00') : materialColor}
            transmission={0.9}
            opacity={1}
            metalness={0.5}
            roughness={0}
            ior={1.5}
            thickness={2}
            transparent
            emissive={gameStore.isFever ? '#ffffff' : '#000000'}
            emissiveIntensity={gameStore.isFever ? 0.5 : 0}
        />
    ), [type, gameStore.isFever]);

    return (
        <mesh ref={meshRef} position={position} scale={[scale, scale, 1]}>
            <boxGeometry args={[1.5, 2, 0.2]} />
            {materialProxy}
        </mesh>
    );
};
