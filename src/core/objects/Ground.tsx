import { useRef } from "react";
import { useFrame } from "@react-three/fiber"; // Removed 'useThree'

export const Ground = () => {
    const meshRef = useRef<any>(null);

    useFrame(({ camera }) => {
        if (meshRef.current) {
            // Ensure the ground follows the camera's Z position
            // We clamp/snap to avoid jitter if needed, or just pure follow
            meshRef.current.position.z = camera.position.z;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial
                color="#1a1a1a"
                roughness={0.4}
                metalness={0.8}
            // Wireframe-ish or grid look can be added with texture later
            />
            <gridHelper args={[100, 50, 0xff0000, 0x444444]} rotation={[-Math.PI / 2, 0, 0]} />
        </mesh>
    );
};
