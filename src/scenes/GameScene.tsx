import { Canvas } from '@react-three/fiber';
import { PlayerController } from '../core/controller/PlayerController';
import { ObjectManager } from '../core/managers/ObjectManager';
import { Ground } from '../core/objects/Ground';
import { Suspense } from 'react';

export const GameScene = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                />

                {/* Environment */}
                <color attach="background" args={['#101015']} />
                <fog attach="fog" args={['#101015', 5, 30]} />

                {/* Game Objects */}
                <Suspense fallback={null}>
                    <PlayerController />
                    <ObjectManager />
                    <Ground />
                </Suspense>
            </Canvas>
        </div>
    );
};
