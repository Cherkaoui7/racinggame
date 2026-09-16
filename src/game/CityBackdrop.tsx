import { useMemo } from 'react'
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

  return (
    <group>
      {/* Sky starfield & atmospheric dust */}
      <StarField count={isLow ? 80 : effectiveQuality === 'medium' ? 250 : 600} />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <group key={i} position={b.position}>
          {/* Main Tower Block */}
          <mesh>
            <boxGeometry args={b.size} />
            {isLow ? (
              <meshBasicMaterial color={b.color} />
            ) : (
              <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.3} />
            )}
          </mesh>

          {/* Rooftop Trim & Beacon */}
          <mesh position={[0, b.size[1] / 2 + 0.5, 0]}>
            <boxGeometry args={[b.size[0] + 0.4, 0.8, b.size[2] + 0.4]} />
            <meshStandardMaterial
              color={b.windowColor}
              emissive={b.windowColor}
              emissiveIntensity={1.2}
            />
          </mesh>

          {/* Roof Antenna (High only) */}
          {b.hasAntenna && (
            <group position={[0, b.size[1] / 2 + 6, 0]}>
              <mesh>
                <cylinderGeometry args={[0.2, 0.4, 12, 6]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} />
              </mesh>
              <mesh position={[0, 6, 0]}>
                <sphereGeometry args={[0.6, 8, 8]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
              </mesh>
            </group>
          )}
        </group>
      ))}

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
