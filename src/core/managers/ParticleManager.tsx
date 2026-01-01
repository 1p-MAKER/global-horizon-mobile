import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gameStore } from "../store/GameStore";

const MAX_PARTICLES = 2000;
const DUMMY = new THREE.Object3D();

export const ParticleManager = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const spawnIndex = useRef(0);

    // Particle State
    const particles = useMemo(() => {
        return new Array(MAX_PARTICLES).fill(0).map(() => ({
            active: false,
            pos: new THREE.Vector3(),
            vel: new THREE.Vector3(),
            rot: new THREE.Vector3(),
            rotVel: new THREE.Vector3(),
            scale: 1,
            life: 0,
            color: new THREE.Color()
        }));
    }, []);

    const spawnParticles = (position: [number, number, number], colorHex: string, count: number = 10) => {
        if (!meshRef.current) return;

        for (let i = 0; i < count; i++) {
            const idx = spawnIndex.current % MAX_PARTICLES;
            const p = particles[idx];

            p.active = true;
            p.pos.set(position[0], position[1], position[2]);

            // Explosive Velocity
            p.vel.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.2) * 12,
                (Math.random() - 0.5) * 15
            );

            p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            p.rotVel.set((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);

            p.scale = Math.random() * 0.6 + 0.3;
            p.life = 1.0;
            p.color.set(colorHex);

            spawnIndex.current++;
        }
    };

    useEffect(() => {
        (window as any).spawnShatterParticles = spawnParticles;
        if (meshRef.current) {
            meshRef.current.frustumCulled = false;
        }
        return () => {
            (window as any).spawnShatterParticles = null;
        };
    }, []);

    useFrame((_state, delta) => {
        if (!meshRef.current) return;

        // Apply game time scale to particles for slow-mo effect
        const scaledDelta = delta * gameStore.timeScale;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (p.active) {
                // Physics - use scaled delta for "slow motion shatter"
                p.life -= delta; // Life should probably be real-time or scaled? Let's use real-time for variety or scaled for consistency. 
                // Using real-time for life ensures the pool recycled correctly, but scaled for motion.

                p.vel.y -= 25 * scaledDelta;
                p.pos.addScaledVector(p.vel, scaledDelta);
                p.rot.addScaledVector(p.rotVel, gameStore.timeScale); // rough rotation scaling

                if (p.life <= 0 || p.pos.y < -5) {
                    p.active = false;
                    DUMMY.scale.setScalar(0);
                    DUMMY.updateMatrix();
                    meshRef.current.setMatrixAt(i, DUMMY.matrix);
                } else {
                    DUMMY.position.copy(p.pos);
                    DUMMY.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                    DUMMY.scale.setScalar(p.scale * p.life);
                    DUMMY.updateMatrix();
                    meshRef.current.setMatrixAt(i, DUMMY.matrix);
                    meshRef.current.setColorAt(i, p.color);
                }
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
};
