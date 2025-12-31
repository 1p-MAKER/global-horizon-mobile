import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

// Configuration
const LANE_WIDTH = 2; // Width of each lane
const SPEED = 10; // Units per second
const LERP_SPEED = 10; // For smooth lane changing

export const PlayerController = () => {
    const groupRef = useRef<any>(null);
    const [targetLane, setTargetLane] = useState(0); // -1, 0, 1
    const { camera } = useThree();

    // Input Handling: Swipe Detection
    useEffect(() => {
        let startX = 0;
        const handleTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
        };
        const handleTouchEnd = (e: TouchEvent) => {
            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            if (Math.abs(diff) > 50) { // Threshold
                // Swipe Right (diff > 0) -> Move Right (+1)
                // Swipe Left (diff < 0) -> Move Left (-1)
                if (diff > 0) changeLane(1);
                else changeLane(-1);
            }
        };

        // Keyboard support for testing
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') changeLane(-1);
            if (e.key === 'ArrowRight') changeLane(1);
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []); // Removed dependency on targetLane to avoid re-binding listeners constantly, forcing functional update in setTargetLane

    const changeLane = (direction: number) => {
        // limit lanes to -1, 0, 1
        setTargetLane(prev => {
            const next = prev + direction;
            if (next < -1) return -1;
            if (next > 1) return 1;
            return next;
        });
    };

    useFrame((_state, delta) => {
        if (!groupRef.current) return;

        // 1. Move Forward (Negative Z)
        groupRef.current.position.z -= SPEED * delta;

        // 2. Smooth Lane Switching (Lerp X)
        const targetX = targetLane * LANE_WIDTH;
        groupRef.current.position.x += (targetX - groupRef.current.position.x) * LERP_SPEED * delta;

        // 3. Camera Follow
        // Camera position should trail behind the player
        const cameraOffset = new Vector3(0, 3, 5); // Up and Behind
        const smoothCamera = true;

        if (smoothCamera) {
            const targetCamPos = groupRef.current.position.clone().add(cameraOffset);
            // We only want to follow Z smoothly, X should probably follow strictly or smoothly too.
            // Let's keep it full follow for now.
            camera.position.lerp(targetCamPos, 5 * delta);
            camera.lookAt(groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z - 5); // Look slightly ahead
        } else {
            camera.position.copy(groupRef.current.position).add(cameraOffset);
            camera.lookAt(groupRef.current.position);
        }
    });

    return (
        <group ref={groupRef} position={[0, 0.5, 0]}>
            {/* Visual Representation of Player (Cube for now) - ASMR Glass/Crystal later */}
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#00dcb4" emissive="#00dcb4" emissiveIntensity={0.5} roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Add a light attached to player to illuminate surroundings */}
            <pointLight position={[0, 2, -2]} intensity={2} distance={10} decay={2} color="#ffffff" />
        </group>
    );
};
