import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { gameStore } from '../store/GameStore';

// Configuration
const LANE_WIDTH = 2;
const LERP_SPEED = 10;

export const PlayerController = () => {
    const groupRef = useRef<any>(null);
    const [targetLane, setTargetLane] = useState(0);
    const { camera } = useThree();

    // Input Handling: Swipe & Tap
    useEffect(() => {
        let startX = 0;


        const handleTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) changeLane(1);
                else changeLane(-1);
            } else {
                // Tap detected (Attack)
                handleAttack();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') changeLane(-1);
            if (e.key === 'ArrowRight') changeLane(1);
            if (e.key === ' ' || e.key === 'Enter') handleAttack();
        };



        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const changeLane = (direction: number) => {
        setTargetLane(prev => {
            const next = prev + direction;
            if (next < -1) return -1;
            if (next > 1) return 1;
            // Update store lane immediately for collision checks
            gameStore.playerLane = next;
            return next;
        });
    };

    const handleAttack = () => {
        gameStore.isAttacking = true;
        // Reset attack flag next frame or after short delay is handled in ObjectManager or logic loop usually,
        // but let's simple reset it with setTimeout for now or handle in useFrame.
        // Better: let useFrame reset it after processing? Or set a frame counter.
        // Simplest: Time limit.
        setTimeout(() => { gameStore.isAttacking = false; }, 250);
    };

    useFrame((_state, delta) => {
        if (!groupRef.current || gameStore.isGameOver || gameStore.isPaused) return;

        const scaledDelta = delta * gameStore.timeScale;

        // 1. Move Forward
        groupRef.current.position.z -= gameStore.speed * scaledDelta;

        // Sync to Store
        gameStore.playerZ = groupRef.current.position.z;
        gameStore.playerLane = targetLane;

        // 2. Smooth Lane Switching
        const targetX = targetLane * LANE_WIDTH;
        groupRef.current.position.x += (targetX - groupRef.current.position.x) * LERP_SPEED * scaledDelta;

        // 3. Camera Follow
        const cameraOffset = new Vector3(0, 3, 5);
        const targetCamPos = groupRef.current.position.clone().add(cameraOffset);
        camera.position.lerp(targetCamPos, 5 * scaledDelta);
        camera.lookAt(groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z - 5);

        // Visual feedback for attack (pulse scale)
        if (gameStore.isAttacking) {
            groupRef.current.scale.set(1.2, 1.2, 1.2);
        } else {
            groupRef.current.scale.lerp(new Vector3(1, 1, 1), 10 * scaledDelta);
        }

        // Ensure visibility is reset if it was left hidden
        groupRef.current.visible = true;
    });

    return (
        <group ref={groupRef} position={[0, 0.5, 0]}>
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#00dcb4" emissive="#00dcb4" emissiveIntensity={0.5} roughness={0.1} metalness={0.9} />
            </mesh>
            <pointLight position={[0, 2, -2]} intensity={2} distance={10} decay={2} color="#ffffff" />
        </group>
    );
};
