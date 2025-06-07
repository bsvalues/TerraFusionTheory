import React, { useEffect, useRef } from 'react';
import { useThree, Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { fibonacciSpiral, voronoiTessellation } from '../utils/sacredGeometry';

const SacredGeometryVisualizer = ({ data, viewMode = 'spiral' }) => {
  const meshRef = useRef();
  const { scene } = useThree();

  useEffect(() => {
    if (!data) return;

    const geometry = viewMode === 'spiral' 
      ? fibonacciSpiral(data)
      : voronoiTessellation(data);

    if (meshRef.current) {
      meshRef.current.geometry = geometry;
    }
  }, [data, viewMode]);

  return (
    <mesh ref={meshRef}>
      <meshStandardMaterial 
        color="#4a90e2"
        metalness={0.8}
        roughness={0.2}
        emissive="#1a365d"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

const MarketEnergyFlow = ({ data }) => {
  const flowRef = useRef();
  const { clock } = useThree();

  useEffect(() => {
    if (!data || !flowRef.current) return;

    const animate = () => {
      const time = clock.getElapsedTime();
      flowRef.current.rotation.y = time * 0.2;
      flowRef.current.position.y = Math.sin(time) * 0.1;
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [data, clock]);

  return (
    <group ref={flowRef}>
      <SacredGeometryVisualizer data={data} />
    </group>
  );
};

const GAMAVisualizer = ({ marketData, propertyData, viewMode }) => {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 to-slate-800">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <MarketEnergyFlow data={marketData} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h3 className="text-xl font-light">Market Energy Flow</h3>
            <p className="text-sm opacity-75">Visualizing the sacred geometry of real estate</p>
          </div>
          <div className="flex space-x-4">
            <button 
              className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
              onClick={() => setViewMode('spiral')}
            >
              Fibonacci Spiral
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
              onClick={() => setViewMode('voronoi')}
            >
              Voronoi Tessellation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GAMAVisualizer; 