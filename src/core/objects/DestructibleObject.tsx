import { useRef, useMemo } from 'react';
import { gameStore } from '../store/GameStore';
import * as THREE from 'three';

interface DestructibleObjectProps {
    id: string; // Kept for ID reference if needed by key, but logic is external
    position: [number, number, number];
    type: 'glass' | 'ice';
    scale?: number;
    color?: string;
    onHit?: (id: string) => void; // Optional now as logic is external, but kept for interface compatibility
}

export const DestructibleObject = ({ position, type, scale = 1, color }: DestructibleObjectProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialColor = color || (type === 'glass' ? '#aaddff' : '#ffffff');

    // Collision logic removed: handled centrally in ObjectManager

    const materialProxy = useMemo(() => (
        <meshPhysicalMaterial
            color={materialColor}
            transmission={0.9}
            opacity={1}
            metalness={0.5}
            roughness={0}
            ior={1.5}
            thickness={2}
            transparent
            emissive={color || (gameStore.isFever ? '#ffffff' : '#000000')}
            emissiveIntensity={gameStore.isFever ? 0.5 : 0}
        />
    ), [type, gameStore.isFever, color]);

    return (
        <mesh ref={meshRef} position={position} scale={[scale, scale, 1]}>
            <boxGeometry args={[1.5, 2, 0.2]} />
            {materialProxy}
        </mesh>
    );
};
