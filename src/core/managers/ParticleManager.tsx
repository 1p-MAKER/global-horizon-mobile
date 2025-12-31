import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";


const MAX_PARTICLES = 1000;
const DUMMY = new THREE.Object3D();

export const ParticleManager = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Particle State
    // We handle logic in mutable arrays for performance (avoiding React state per particle)
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
        let spawned = 0;
        for (let i = 0; i < MAX_PARTICLES; i++) {
            if (!particles[i].active) {
                const p = particles[i];
                p.active = true;
                p.pos.set(position[0], position[1], position[2]);

                // Explosive Velocity
                p.vel.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                );

                p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                p.rotVel.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);

                p.scale = Math.random() * 0.5 + 0.2;
                p.life = 1.0; // Seconds
                p.color.set(colorHex);

                spawned++;
                if (spawned >= count) break;
            }
        }
    };

    // Sub to global events? 
    // Ideally, ObjectManager should call spawnParticles.
    // We can expose this function via a Global or Store, OR listen to store events.
    // For now, let's attach to the window or a global store signal for simplicity,
    // OR: Pass this function up? No, Manager should be self-contained.
    // Let's use a Custom Event on window for loose coupling?
    // Or better: Export a singleton helper?
    // Let's rely on the subscribeToStore to listen for "LastBreak" event?
    // No, store is simple state.
    // Strategy: Add a `onShatter` callback registry in GameStore to keep it clean.

    useEffect(() => {
        // HACK: Bind to global scope for now to let ObjectManager call it without complex Context passing
        // In a strict app, we'd use a Context or a signal library.
        (window as any).spawnShatterParticles = spawnParticles;
        return () => {
            (window as any).spawnShatterParticles = null;
        };
    }, []);

    useFrame((_state, delta) => {
        if (!meshRef.current) return;

        let activeCount = 0;
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (p.active) {
                // Physics
                p.life -= delta;
                p.vel.y -= 20 * delta; // Gravity
                p.pos.addScaledVector(p.vel, delta);
                p.rot.add(p.rotVel);

                if (p.life <= 0 || p.pos.y < -5) {
                    p.active = false;
                    p.scale = 0;
                } else {
                    activeCount++;
                    // Update Instance Matrix
                    DUMMY.position.copy(p.pos);
                    DUMMY.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                    DUMMY.scale.setScalar(p.scale * p.life); // Fade out size
                    DUMMY.updateMatrix();
                    meshRef.current.setMatrixAt(i, DUMMY.matrix);
                    meshRef.current.setColorAt(i, p.color);
                }
            } else {
                // Hide inactive
                DUMMY.scale.setScalar(0);
                DUMMY.updateMatrix();
                meshRef.current.setMatrixAt(i, DUMMY.matrix);
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
            <dodecahedronGeometry args={[0.2, 0]} /> {/* Jagged shape */}
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
};
