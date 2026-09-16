import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Car } from './Car'
import { AICar } from './AICar'
import { Track } from './Track'
import { CityBackdrop } from './CityBackdrop'
import { HUD } from '../components/HUD'
import { PerformanceGovernor } from './PerformanceGovernor'

import { useGameStore } from '../store/useGameStore'

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'w', 'W', 'z', 'Z', 'KeyW', 'KeyZ'] },
  { name: 'backward', keys: ['ArrowDown', 's', 'S', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'a', 'A', 'q', 'Q', 'KeyA', 'KeyQ'] },
  { name: 'right', keys: ['ArrowRight', 'd', 'D', 'KeyD'] },
  { name: 'brake', keys: ['Space', ' '] },
  { name: 'nitro', keys: ['ShiftLeft', 'ShiftRight', 'Shift'] },
  { name: 'camera', keys: ['c', 'C', 'KeyC'] },
  { name: 'respawn', keys: ['r', 'R', 'KeyR'] }
]

export function Game() {
  const { gameId, effectiveQuality, dynamicDpr } = useGameStore()

  const isLow = effectiveQuality === 'low'
  const isHigh = effectiveQuality === 'high'

  const shadowMapSize: [number, number] = isHigh ? [2048, 2048] : [1024, 1024]

  return (
    <>
      <KeyboardControls map={keyboardMap}>
        <Canvas 
          shadows={isHigh ? { type: THREE.PCFShadowMap } : false} 
          dpr={dynamicDpr}
          gl={{ 
            powerPreference: 'high-performance', 
            antialias: !isLow, 
            stencil: false, 
            alpha: false, 
            depth: true
          }}
          camera={{ position: [0, 5, 10], fov: 60 }}
        >
          <PerformanceGovernor />
          <color attach="background" args={['#060a1a']} />
          
          <ambientLight intensity={1.3} color="#93c5fd" />
          <hemisphereLight args={['#67e8f9', '#1e293b', 1.0]} />
          <directionalLight 
            castShadow={isHigh} 
            position={[50, 100, 50]} 
            intensity={2.2} 
            color="#f1f5f9"
            shadow-mapSize={shadowMapSize}
            shadow-camera-near={10}
            shadow-camera-far={250}
            shadow-camera-left={-80}
            shadow-camera-right={80}
            shadow-camera-top={80}
            shadow-camera-bottom={-80}
            shadow-bias={-0.0005}
          />
          <directionalLight 
            position={[-50, 80, -50]} 
            intensity={1.0} 
            color="#38bdf8"
          />

          <fog attach="fog" args={['#060a1a', 120, 420]} />

          {/* Procedural Cyberpunk Skyline & Billboards */}
          <CityBackdrop />

          <Physics key={gameId} colliders={false} timeStep="vary">
            <Car />
            {/* Starting Grid: Player at Pole Position (-30, 0.8, -62.5). AI competitors in 2x2 grid behind */}
            <AICar id="shadow" name="Shadow" color="#ef4444" initialPosition={[-37, 1, -59.5]} speedMultiplier={0.94} laneOffset={-2.5} />
            <AICar id="neon" name="Neon" color="#f59e0b" initialPosition={[-41, 1, -65.5]} speedMultiplier={0.91} laneOffset={2.5} />
            <AICar id="blaze" name="Blaze" color="#06b6d4" initialPosition={[-47, 1, -59.5]} speedMultiplier={0.88} laneOffset={-1.5} />
            <AICar id="drift" name="Drift" color="#a855f7" initialPosition={[-51, 1, -65.5]} speedMultiplier={0.85} laneOffset={1.5} />
            <AICar id="apex" name="Apex" color="#22c55e" initialPosition={[-57, 1, -59.5]} speedMultiplier={0.82} laneOffset={-3.0} />
            <AICar id="nova" name="Nova" color="#ec4899" initialPosition={[-61, 1, -65.5]} speedMultiplier={0.79} laneOffset={3.0} />
            <AICar id="rex" name="Rex" color="#eab308" initialPosition={[-67, 1, -62.5]} speedMultiplier={0.76} laneOffset={0} />
            <Track />
          </Physics>
        </Canvas>
      </KeyboardControls>
      
      <HUD />
    </>
  )
}
