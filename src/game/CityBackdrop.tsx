import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'

interface BuildingData {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  windowColor: string
  hasAntenna: boolean
}

function createPRNG(seed = 12345) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function CityBackdrop() {
  const effectiveQuality = useGameStore(state => state.effectiveQuality)

  const buildings = useMemo<BuildingData[]>(() => {
    const random = createPRNG(42)
    const list: BuildingData[] = []
    const palette = ['#111827', '#1e293b', '#1e1b4b', '#0f172a', '#172554']
    const windowPalette = ['#06b6d4', '#ec4899', '#a855f7', '#38bdf8', '#fbbf24']

    const isLow = effectiveQuality === 'low'
    const isMedium = effectiveQuality === 'medium'
    const countMult = isLow ? 0.2 : isMedium ? 0.5 : 1.0

    // Generate clusters of skyscrapers along the 4 outer sides of the track
    const spawnPerimeter = (
      xMin: number,
      xMax: number,
      zMin: number,
      zMax: number,
      count: number
    ) => {
      const actualCount = Math.max(2, Math.round(count * countMult))
      for (let i = 0; i < actualCount; i++) {
        const x = xMin + random() * (xMax - xMin)
        const z = zMin + random() * (zMax - zMin)
        const width = 12 + random() * 16
        const depth = 12 + random() * 16
        const height = 35 + random() * 85
        const color = palette[Math.floor(random() * palette.length)]
        const windowColor = windowPalette[Math.floor(random() * windowPalette.length)]
        const hasAntenna = isLow ? false : random() > 0.4

        list.push({
          position: [x, height / 2, z],
          size: [width, height, depth],
          color,
          windowColor,
          hasAntenna,
        })
      }
    }

    // North outer city (z: -170 to -95)
    spawnPerimeter(-150, 150, -170, -95, 20)
    // South outer city (z: 95 to 170)
    spawnPerimeter(-150, 150, 95, 170, 20)
    // West outer city (x: -170 to -95)
    spawnPerimeter(-170, -95, -120, 120, 16)
    // East outer city (x: 95 to 170)
    spawnPerimeter(95, 170, -120, 120, 16)

    // Center Plaza high-tech skyscrapers
    spawnPerimeter(-35, 35, -35, 35, 8)

    return list
  }, [effectiveQuality])

  const isLow = effectiveQuality === 'low'

  // InstancedMesh refs
  const buildingMeshRef = useRef<THREE.InstancedMesh>(null)
  const windowMeshRef = useRef<THREE.InstancedMesh>(null)
  const antennaBaseRef = useRef<THREE.InstancedMesh>(null)
  const antennaLightRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    if (!buildingMeshRef.current || !windowMeshRef.current) return

    const dummy = new THREE.Object3D()
    const colorObj = new THREE.Color()

    let antennaIndex = 0

    buildings.forEach((b, i) => {
      // 1. Main Tower Block
      dummy.position.set(b.position[0], b.position[1], b.position[2])
      dummy.scale.set(b.size[0], b.size[1], b.size[2])
      dummy.updateMatrix()
      buildingMeshRef.current!.setMatrixAt(i, dummy.matrix)
      buildingMeshRef.current!.setColorAt(i, colorObj.set(b.color))

      // 2. Rooftop Trim & Beacon
      dummy.position.set(b.position[0], b.position[1] + b.size[1] / 2 + 0.5, b.position[2])
      dummy.scale.set(b.size[0] + 0.4, 0.8, b.size[2] + 0.4)
      dummy.updateMatrix()
      windowMeshRef.current!.setMatrixAt(i, dummy.matrix)
      windowMeshRef.current!.setColorAt(i, colorObj.set(b.windowColor))

      // 3. Antenna
      if (b.hasAntenna && antennaBaseRef.current && antennaLightRef.current) {
        dummy.position.set(b.position[0], b.position[1] + b.size[1] / 2 + 6, b.position[2])
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        antennaBaseRef.current.setMatrixAt(antennaIndex, dummy.matrix)

        dummy.position.set(b.position[0], b.position[1] + b.size[1] / 2 + 12, b.position[2])
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        antennaLightRef.current.setMatrixAt(antennaIndex, dummy.matrix)
        
        antennaIndex++
      }
    })

    buildingMeshRef.current.instanceMatrix.needsUpdate = true
    if (buildingMeshRef.current.instanceColor) buildingMeshRef.current.instanceColor.needsUpdate = true
    
    windowMeshRef.current.instanceMatrix.needsUpdate = true
    if (windowMeshRef.current.instanceColor) windowMeshRef.current.instanceColor.needsUpdate = true

    if (antennaBaseRef.current) antennaBaseRef.current.instanceMatrix.needsUpdate = true
    if (antennaLightRef.current) antennaLightRef.current.instanceMatrix.needsUpdate = true

  }, [buildings])

  const totalAntennas = buildings.filter(b => b.hasAntenna).length

  return (
    <group>
      {/* Sky starfield & atmospheric dust */}
      <StarField count={isLow ? 80 : effectiveQuality === 'medium' ? 250 : 600} />

      {/* Instanced Buildings */}
      <instancedMesh ref={buildingMeshRef} args={[null, null, buildings.length] as any}>
        <boxGeometry />
        {isLow ? (
          <meshBasicMaterial />
        ) : (
          <meshStandardMaterial roughness={0.7} metalness={0.3} />
        )}
      </instancedMesh>

      <instancedMesh ref={windowMeshRef} args={[null, null, buildings.length] as any}>
        <boxGeometry />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.2} />
      </instancedMesh>

      {totalAntennas > 0 && (
        <>
          <instancedMesh ref={antennaBaseRef} args={[null, null, totalAntennas] as any}>
            <cylinderGeometry args={[0.2, 0.4, 12, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </instancedMesh>
          <instancedMesh ref={antennaLightRef} args={[null, null, totalAntennas] as any}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
          </instancedMesh>
        </>
      )}

      {/* Holographic Mega Billboards */}
      <HoloBillboard position={[0, 25, -90]} rotation={[0, 0, 0]} color="#06b6d4" text={['NEON CITY', 'TURBO SPEED']} />
      <HoloBillboard position={[90, 25, 0]} rotation={[0, -Math.PI / 2, 0]} color="#ec4899" text={['CYBERPUNK', 'CHAMPIONSHIP']} />
      <HoloBillboard position={[0, 25, 90]} rotation={[0, Math.PI, 0]} color="#a855f7" text={['QUANTUM', 'OVERDRIVE']} />
      <HoloBillboard position={[-90, 25, 0]} rotation={[0, Math.PI / 2, 0]} color="#22c55e" text={['LIMITLESS', 'RACER']} />
    </group>
  )
}

function StarField({ count = 600 }: { count?: number }) {
  const points = useMemo(() => {
    const random = createPRNG(999)
    const coords = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI * 2
      const phi = Math.acos(random() * 0.9 + 0.1)
      const radius = 250 + random() * 50
      coords[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      coords[i * 3 + 1] = radius * Math.cos(phi) + 20
      coords[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }
    return coords
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={1.5} color="#c7d2fe" transparent opacity={0.8} />
    </points>
  )
}

function HoloBillboard({
  position,
  rotation,
  color,
  text
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  text?: string[]
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Support Truss Pillars */}
      <mesh position={[-16, -10, 0]}>
        <boxGeometry args={[1, 22, 1]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[16, -10, 0]}>
        <boxGeometry args={[1, 22, 1]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Frame Screen */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[36, 12, 1]} />
        <meshStandardMaterial color="#020617" roughness={0.4} />
      </mesh>

      {/* Glowing Border */}
      <mesh position={[0, 0, 0.6]}>
        <planeGeometry args={[35, 11]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
      </mesh>

      {text && (
        <group position={[0, 2, 0.6]}>
          {text.map((line, idx) => (
            <Text key={idx} position={[0, -idx * 2, 0]} color={color} fontSize={1.8} outlineWidth={0.05} outlineColor="#000">
              {line}
            </Text>
          ))}
        </group>
      )}

      {/* Top Banner Accent */}
      <mesh position={[0, 6, 0.6]}>
        <boxGeometry args={[36, 0.8, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, -6, 0.6]}>
        <boxGeometry args={[36, 0.8, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>

      {/* Distant Hologram self-illuminates with emissive material (no dynamic pointLight needed) */}
    </group>
  )
}
