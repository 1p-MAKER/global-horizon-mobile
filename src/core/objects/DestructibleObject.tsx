import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { gameStore } from '../store/GameStore';
import * as THREE from 'three';

interface DestructibleObjectProps {
    id: string;
    position: [number, number, number];
    type: 'glass' | 'ice';
    onHit: (id: string) => void;
}

export const DestructibleObject = ({ id, position, type, onHit }: DestructibleObjectProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialColor = type === 'glass' ? '#aaddff' : '#ffffff';

    useFrame(() => {
        if (!meshRef.current) return;

        // Simple Collision Logic
        // Check Z distance
        const playerZ = gameStore.playerZ;
        const myZ = position[2];

        // Actually, coordinate system: Player starts 0, moves -Z. Objects are at -10, -20...
        // so myZ < playerZ check. 
        // distance: abs(myZ - playerZ).

        // Collision Window: when object is slightly in front of player
        // Player is at Z, Object is at Z_obj. Player moving -Z.
        // If Abs(PlayerZ - ObjectZ) < 1.0 AND PlayerLane == ObjectLane

        // Lane check
        const myLane = Math.round(position[0] / 2); // Lane width 2.

        if (!gameStore.isGameOver && Math.abs(playerZ - myZ) < 1.0 && gameStore.playerLane === myLane) {
            // In range.
            // Check if attacking
            if (gameStore.isAttacking) {
                // HIT!
                onHit(id);
            } else if (playerZ < myZ) {
                // CRASH! If player has reached the object and is NOT attacking
                gameStore.isGameOver = true;
                import('../store/GameStore').then(m => m.notifyStoreUpdate());
            }
        }
    });

    const materialProxy = useMemo(() => (
        <meshPhysicalMaterial
            color={materialColor}
            transmission={0.9} // Glass logic
            opacity={1}
            metalness={0}
            roughness={0}
            ior={1.5}
            thickness={2}
            transparent
        />
    ), [type]);

    return (
        <mesh ref={meshRef} position={position}>
            <boxGeometry args={[1.5, 2, 0.2]} />
            {materialProxy}
        </mesh>
    );
};
