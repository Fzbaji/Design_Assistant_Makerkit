'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stage, PerspectiveCamera } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Suspense } from 'react';

interface ThreeDViewerProps {
  modelUrl: string;
  productName?: string;
}

function Model({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  
  return <primitive object={gltf.scene} />;
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  );
}

export function ThreeDViewer({ modelUrl, productName }: ThreeDViewerProps) {
  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
        <Suspense fallback={<Loader />}>
          <Stage
            intensity={0.5}
            environment="city"
            shadows={{ type: 'contact', offset: 0, blur: 2, opacity: 0.5 }}
            adjustCamera={1.5}
          >
            <Model url={modelUrl} />
          </Stage>
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />

        <Environment preset="city" />
      </Canvas>
      
      {productName && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded">
          <p className="text-sm">{productName}</p>
          <p className="text-xs text-gray-300">Utilisez la souris pour pivoter, zoomer, déplacer</p>
        </div>
      )}
    </div>
  );
}
