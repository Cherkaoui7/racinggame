import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

const CARS = [
  { id: 'neon', name: 'Neon Sport', color: '#aa3bff', topSpeed: 60, handling: 80, accel: 70 },
  { id: 'muscle', name: 'V8 Muscle', color: '#ff3b3b', topSpeed: 70, handling: 50, accel: 90 },
  { id: 'drift', name: 'Drift King', color: '#3bff65', topSpeed: 55, handling: 95, accel: 65 },
]

function CarModel({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/Mini cooper.glb')
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    const targetColor = new THREE.Color(color)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          const mat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial
          mesh.material = mat
          const name = ((mat.name || '') + ' ' + (mesh.name || '')).toLowerCase()
          const isExcluded = 
            name.includes('glass') || 
            name.includes('window') || 
            name.includes('tire') || 
            name.includes('wheel') || 
            name.includes('interior') || 
            name.includes('mirror') || 
            name.includes('light') || 
            name.includes('rim') ||
            name.includes('chrome')
          if (!isExcluded) {
            mat.color = targetColor
            mat.roughness = 0.3
            mat.metalness = 0.7
          }
        }
      }
    })
    return clone
  }, [scene, color])
  
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.6
    }
  })

  return (
    <group ref={group}>
      <primitive object={clonedScene} scale={1.2} position={[0, -0.4, 0]} />
    </group>
  )
}

export function Garage() {
  const { closeGarage, selectedCar, selectCar } = useGameStore()
  
  const currentIndex = CARS.findIndex(c => c.id === selectedCar)
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const currentCarData = CARS[safeIndex]

  const handleNext = () => {
    const nextIndex = (safeIndex + 1) % CARS.length
    selectCar(CARS[nextIndex].id)
  }

  const handlePrev = () => {
    const prevIndex = (safeIndex - 1 + CARS.length) % CARS.length
    selectCar(CARS[prevIndex].id)
  }

  return (
    <div className="absolute inset-0 bg-neutral-900 text-white font-sans flex">
      {/* Left UI Panel */}
      <div className="w-1/3 bg-black/50 p-8 flex flex-col justify-between z-10 border-r border-white/10">
        <div>
          <button 
            onClick={closeGarage}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold mb-12"
          >
            <ArrowLeft size={16} />
            <span>Back to Menu</span>
          </button>

          <h2 className="text-5xl font-black italic mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            {currentCarData.name}
          </h2>
          <p className="text-gray-400 uppercase tracking-widest text-sm mb-12">Select your vehicle</p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-2">
                <span>Top Speed</span>
                <span>{currentCarData.topSpeed}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${currentCarData.topSpeed}%` }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-2">
                <span>Acceleration</span>
                <span>{currentCarData.accel}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${currentCarData.accel}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-2">
                <span>Handling</span>
                <span>{currentCarData.handling}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-400" style={{ width: `${currentCarData.handling}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right 3D View */}
      <div className="flex-1 relative">
        <Canvas 
          camera={{ position: [5, 3, 5], fov: 45 }}
          gl={{ powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#0a0f1d']} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 15, 10]} intensity={1.2} />
          <spotLight position={[-10, 10, -5]} angle={0.3} penumbra={1} intensity={1.2} color="#38bdf8" />
          <pointLight position={[0, 3, 0]} intensity={1.2} color={currentCarData.color} distance={8} />
          
          <CarModel color={currentCarData.color} />
          
          <ContactShadows position={[0, -0.4, 0]} opacity={0.7} scale={10} blur={2} far={4} />
          <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/2 - 0.1} />
        </Canvas>

        {/* Navigation Arrows */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-12 pointer-events-none">
          <button onClick={handlePrev} className="pointer-events-auto bg-black/50 p-4 rounded-full hover:bg-white/20 transition-colors border border-white/10">
            <ChevronLeft size={32} />
          </button>
          <button onClick={handleNext} className="pointer-events-auto bg-black/50 p-4 rounded-full hover:bg-white/20 transition-colors border border-white/10">
            <ChevronRight size={32} />
          </button>
        </div>
      </div>
    </div>
  )
}
