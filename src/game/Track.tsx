import { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'

export function Track() {
  return (
    <group>
      {/* Solid Ground & Off-Track Runoff Area */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[300, 2, 300]} position={[0, -2, 0]} friction={0.3} restitution={0} />
        <mesh receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[600, 600]} />
          <meshStandardMaterial color="#131d2e" roughness={0.85} />
        </mesh>
      </RigidBody>

      {/* Central Plaza Ground */}
      <mesh receiveShadow position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a253c" roughness={0.7} />
      </mesh>
      <gridHelper args={[100, 20, '#00f0ff', '#334155']} position={[0, -0.03, 0]} />

      {/* Racetrack Asphalt Surfaces */}
      <AsphaltRoadway />

      {/* Racing Curbs / Rumble Strips on Corners */}
      <CornerCurbs />

      {/* Track Barriers & Neon Guardrails (outer & inner) */}
      <TrackBarriers />

      {/* Corner Turn Chevron Signs */}
      <CornerChevrons />

      {/* Streetlight Gantries */}
      <StreetlightGantries />

      {/* Start / Finish Gantry Architecture */}
      <StartFinishGantry />

      {/* Checkpoint Gates & Sensors */}
      <CheckpointGates />
    </group>
  )
}

function AsphaltRoadway() {
  const roadMaterial = (
    <meshStandardMaterial
      color="#1e293b"
      roughness={0.4}
      metalness={0.2}
    />
  )

  return (
    <group position={[0, -0.02, 0]}>
      {/* North Straight (z = -62.5) */}
      <mesh receiveShadow position={[0, 0, -62.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 25]} />
        {roadMaterial}
      </mesh>
      {/* South Straight (z = 62.5) */}
      <mesh receiveShadow position={[0, 0, 62.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 25]} />
        {roadMaterial}
      </mesh>
      {/* East Straight (x = 62.5) */}
      <mesh receiveShadow position={[62.5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 150]} />
        {roadMaterial}
      </mesh>
      {/* West Straight (x = -62.5) */}
      <mesh receiveShadow position={[-62.5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 150]} />
        {roadMaterial}
      </mesh>

      {/* Center Dashed Lines - North & South */}
      {[-55, -35, -15, 5, 25, 45].map((x) => (
        <mesh key={`dash-n-${x}`} position={[x, 0.02, -62.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 0.4]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} />
        </mesh>
      ))}
      {[-55, -35, -15, 5, 25, 45].map((x) => (
        <mesh key={`dash-s-${x}`} position={[x, 0.02, 62.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 0.4]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Center Dashed Lines - East & West */}
      {[-55, -35, -15, 5, 25, 45].map((z) => (
        <mesh key={`dash-e-${z}`} position={[62.5, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 10]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} />
        </mesh>
      ))}
      {[-55, -35, -15, 5, 25, 45].map((z) => (
        <mesh key={`dash-w-${z}`} position={[-62.5, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 10]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function CornerCurbs() {
  // Rumble strips at inner corner apexes
  const apexes = [
    { pos: [50, 0.05, -50], rot: [0, -Math.PI / 4, 0] },
    { pos: [50, 0.05, 50], rot: [0, Math.PI / 4, 0] },
    { pos: [-50, 0.05, 50], rot: [0, (3 * Math.PI) / 4, 0] },
    { pos: [-50, 0.05, -50], rot: [0, -(3 * Math.PI) / 4, 0] },
  ]

  return (
    <group>
      {apexes.map((apex, i) => (
        <group key={i} position={apex.pos as [number, number, number]} rotation={apex.rot as [number, number, number]}>
          {Array.from({ length: 12 }).map((_, j) => {
            const isRed = j % 2 === 0
            return (
              <mesh key={j} position={[(j - 6) * 1.5, 0, 0]}>
                <boxGeometry args={[1.3, 0.15, 2.5]} />
                <meshStandardMaterial
                  color={isRed ? '#ef4444' : '#f8fafc'}
                  emissive={isRed ? '#ef4444' : '#000000'}
                  emissiveIntensity={isRed ? 0.3 : 0}
                />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

function TrackBarriers() {
  return (
    <group>
      {/* Outer Crash Barriers (Height 2m, physical collider 3.5m) */}
      <BarrierWall position={[0, 1, -75]} args={[152, 2, 1.2]} neonColor="#06b6d4" />
      <BarrierWall position={[0, 1, 75]} args={[152, 2, 1.2]} neonColor="#06b6d4" />
      <BarrierWall position={[-75, 1, 0]} args={[1.2, 2, 152]} neonColor="#06b6d4" />
      <BarrierWall position={[75, 1, 0]} args={[1.2, 2, 152]} neonColor="#06b6d4" />

      {/* Inner Crash Barriers (Surrounding Central Plaza) */}
      <BarrierWall position={[0, 1, -50]} args={[100, 2, 1.2]} neonColor="#ec4899" />
      <BarrierWall position={[0, 1, 50]} args={[100, 2, 1.2]} neonColor="#ec4899" />
      <BarrierWall position={[-50, 1, 0]} args={[1.2, 2, 100]} neonColor="#ec4899" />
      <BarrierWall position={[50, 1, 0]} args={[1.2, 2, 100]} neonColor="#ec4899" />
    </group>
  )
}

function BarrierWall({
  position,
  args,
  neonColor,
}: {
  position: [number, number, number]
  args: [number, number, number]
  neonColor: string
}) {
  return (
    <RigidBody type="fixed" colliders={false} friction={0.05} restitution={0.05}>
      {/* Physical Collider */}
      <CuboidCollider args={[args[0] / 2, 2, args[2] / 2]} position={position} />

      {/* Visual Barrier Base */}
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color="#070b14" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glowing Neon LED Top Strip */}
      <mesh position={[position[0], position[1] + args[1] / 2 + 0.05, position[2]]}>
        <boxGeometry args={[args[0] > args[2] ? args[0] : 0.12, 0.1, args[2] > args[0] ? args[2] : 0.12]} />
        <meshStandardMaterial color={neonColor} emissive={neonColor} emissiveIntensity={4} />
      </mesh>
    </RigidBody>
  )
}

function CornerChevrons() {
  // Arrow signs positioned on outer barrier walls facing incoming drivers
  return (
    <group>
      {/* Turn 1 (North-East Corner): Warning drivers to turn South */}
      <ChevronSign position={[73, 3, -65]} rotation={[0, -Math.PI / 2, 0]} />
      <ChevronSign position={[73, 3, -60]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Turn 2 (South-East Corner): Warning drivers to turn West */}
      <ChevronSign position={[65, 3, 73]} rotation={[0, Math.PI, 0]} />
      <ChevronSign position={[60, 3, 73]} rotation={[0, Math.PI, 0]} />

      {/* Turn 3 (South-West Corner): Warning drivers to turn North */}
      <ChevronSign position={[-73, 3, 65]} rotation={[0, Math.PI / 2, 0]} />
      <ChevronSign position={[-73, 3, 60]} rotation={[0, Math.PI / 2, 0]} />

      {/* Turn 4 (North-West Corner): Warning drivers to turn East */}
      <ChevronSign position={[-65, 3, -73]} rotation={[0, 0, 0]} />
      <ChevronSign position={[-60, 3, -73]} rotation={[0, 0, 0]} />
    </group>
  )
}

function ChevronSign({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[3, 1.8, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* Glowing Chevron Symbol */}
      <mesh position={[0, 0, 0.15]}>
        <planeGeometry args={[2.4, 1.4]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

function StreetlightGantries() {
  const gantryLocations: [number, number, number, number][] = [
    // [x, y, z, rotationY]
    [25, 0, -62.5, 0],
    [62.5, 0, -25, Math.PI / 2],
    [62.5, 0, 25, Math.PI / 2],
    [25, 0, 62.5, 0],
    [-25, 0, 62.5, 0],
    [-62.5, 0, 25, Math.PI / 2],
    [-62.5, 0, -25, Math.PI / 2],
  ]

  return (
    <group>
      {gantryLocations.map((loc, i) => (
        <group key={i} position={[loc[0], loc[1], loc[2]]} rotation={[0, loc[3], 0]}>
          {/* Left Pillar */}
          <mesh position={[0, 5, -13]}>
            <cylinderGeometry args={[0.3, 0.4, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* Right Pillar */}
          <mesh position={[0, 5, 13]}>
            <cylinderGeometry args={[0.3, 0.4, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* Crossbeam */}
          <mesh position={[0, 9.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 26]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          {/* Downward Floodlights */}
          <mesh position={[0, 9.5, -4]}>
            <boxGeometry args={[0.8, 0.4, 1.2]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, 9.5, 4]}>
            <boxGeometry args={[0.8, 0.4, 1.2]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function CheckeredStartLine() {
  const cyanRef = useRef<THREE.InstancedMesh>(null!)
  const darkRef = useRef<THREE.InstancedMesh>(null!)

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    let cyanIdx = 0
    let darkIdx = 0

    for (let i = 0; i < 36; i++) {
      const row = Math.floor(i / 18)
      const col = i % 18
      const isCyan = (row + col) % 2 === 0

      dummy.position.set(row === 0 ? 0.55 : -0.55, (col - 8.5) * 1.45, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()

      if (isCyan) {
        cyanRef.current.setMatrixAt(cyanIdx++, dummy.matrix)
      } else {
        darkRef.current.setMatrixAt(darkIdx++, dummy.matrix)
      }
    }
    cyanRef.current.instanceMatrix.needsUpdate = true
    darkRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={cyanRef} args={[undefined, undefined, 18]}>
        <planeGeometry args={[1.08, 1.42]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={3.5} />
      </instancedMesh>
      <instancedMesh ref={darkRef} args={[undefined, undefined, 18]}>
        <planeGeometry args={[1.08, 1.42]} />
        <meshStandardMaterial color="#070b14" roughness={0.15} metalness={0.6} />
      </instancedMesh>
    </>
  )
}

function StartFinishGantry() {
  return (
    <group position={[-30, 0, -62.5]}>
      {/* Checkered Start Line On Track Surface: Alternating Glowing Cyan and Dark Gloss Squares */}
      <group position={[6.5, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Leading & Trailing Glowing Neon Frame Edges */}
        <mesh position={[-1.12, 0, 0.01]}>
          <planeGeometry args={[0.08, 26]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={5} />
        </mesh>
        <mesh position={[1.12, 0, 0.01]}>
          <planeGeometry args={[0.08, 26]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={5} />
        </mesh>
        <CheckeredStartLine />
      </group>

      {/* Main Overhead Arch Frame (Positioned at x = 16, height 5.8m to frame the camera) */}
      <group position={[16, 0, 0]}>
        {/* Support Pillars */}
        <mesh position={[0, 3.2, -12.5]}>
          <boxGeometry args={[0.8, 6.5, 0.8]} />
          <meshStandardMaterial color="#030712" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 3.2, 12.5]}>
          <boxGeometry args={[0.8, 6.5, 0.8]} />
          <meshStandardMaterial color="#030712" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Outer Cyan Double Horizontal Neon Rails */}
        {/* Top Rail */}
        <mesh position={[0, 6.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 25, 12]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={5} />
        </mesh>
        {/* Bottom Rail */}
        <mesh position={[0, 4.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 25, 12]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={5} />
        </mesh>
        {/* Side Connectors */}
        <mesh position={[0, 5.8, -12.4]}>
          <boxGeometry args={[0.1, 2.1, 0.1]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={4} />
        </mesh>
        <mesh position={[0, 5.8, 12.4]}>
          <boxGeometry args={[0.1, 2.1, 0.1]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={4} />
        </mesh>

        {/* Center Illuminated Sign Backing Plate facing camera (rotation -PI/2) */}
        <mesh position={[-0.45, 5.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[18, 1.9]} />
          <meshStandardMaterial color="#020612" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Top and Bottom Cyan Accent Lines on Sign Plate */}
        <mesh position={[-0.46, 6.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[18, 0.06]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={4} />
        </mesh>
        <mesh position={[-0.46, 4.9, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[18, 0.06]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={4} />
        </mesh>

        {/* Gantry Center Sign: »»  RACE  «« */}
        <group position={[-0.48, 6.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Text
            fontSize={1.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.06}
            outlineColor="#00f0ff"
          >
            »»   RACE   ««
          </Text>
        </group>

        {/* Subtitle: BEYOND LIMITS in hot magenta */}
        <group position={[-0.48, 5.3, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Text
            fontSize={0.55}
            color="#ec4899"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.18}
            outlineWidth={0.03}
            outlineColor="#be185d"
          >
            BEYOND LIMITS
          </Text>
        </group>
      </group>

      {/* Wall Chevron Turn Direction Signs near Gantry */}
      {/* Left Wall: Cyan »» pointing along track, facing camera */}
      <group position={[8, 1.8, -12.3]} rotation={[0, -Math.PI / 2, 0]}>
        <Text fontSize={1.8} color="#00f0ff" outlineWidth={0.06} outlineColor="#22d3ee">
          »»
        </Text>
      </group>
      <group position={[18, 1.8, -12.3]} rotation={[0, -Math.PI / 2, 0]}>
        <Text fontSize={1.8} color="#00f0ff" outlineWidth={0.06} outlineColor="#22d3ee">
          »»
        </Text>
      </group>

      {/* Right Wall: Magenta «« pointing along track, facing camera */}
      <group position={[12, 1.8, 12.3]} rotation={[0, -Math.PI / 2, 0]}>
        <Text fontSize={1.8} color="#ec4899" outlineWidth={0.06} outlineColor="#f43f5e">
          ««
        </Text>
      </group>
      <group position={[20, 1.8, 12.3]} rotation={[0, -Math.PI / 2, 0]}>
        <Text fontSize={1.8} color="#ec4899" outlineWidth={0.06} outlineColor="#f43f5e">
          ««
        </Text>
      </group>

      {/* Right Building Facade Billboard: SPEED DRIVES BETTER PEOPLE */}
      {/* Positioned at y = 10.4 so all 4 words (SPEED, DRIVES, BETTER, PEOPLE) are completely in view */}
      <group position={[17, 10.4, 12.6]} rotation={[0, -Math.PI / 2 - 0.22, 0]}>
        {/* Dark Billboard Backing */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[7.2, 9.6]} />
          <meshStandardMaterial color="#08030e" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Magenta Neon Frame */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[7.0, 9.4]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={3.5} wireframe />
        </mesh>
        {/* Billboard Text */}
        <group position={[0, 0, 0.1]}>
          {['SPEED', 'DRIVES', 'BETTER', 'PEOPLE'].map((word, wIdx) => (
            <Text
              key={wIdx}
              position={[0, 2.7 - wIdx * 1.8, 0]}
              fontSize={1.25}
              color="#ff2a85"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.06}
              outlineColor="#ec4899"
            >
              {word}
            </Text>
          ))}
        </group>
      </group>

      {/* Cyberpunk Vertical Skyline Neon Strip Lights */}
      {/* Left Skyline: Electric Cyan Light Strips */}
      {[-18, -10, -2, 6, 14].map((offset, i) => (
        <mesh key={`sky-cyan-${i}`} position={[offset + 10, 18, -17]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.2, 28 + (i % 3) * 8, 0.2]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={4} />
        </mesh>
      ))}
      {/* Right Skyline: Electric Magenta Light Strips */}
      {[-12, -4, 4, 12, 20].map((offset, i) => (
        <mesh key={`sky-magenta-${i}`} position={[offset + 10, 18, 17]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.2, 28 + (i % 3) * 8, 0.2]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={4} />
        </mesh>
      ))}
    </group>
  )
}

function CheckpointGates() {
  const { passCheckpoint, completeLap } = useGameStore()

  const handleIntersection = (e: any, cp: number) => {
    if (e.other.rigidBodyObject?.name === 'player') {
      passCheckpoint(cp)
    }
  }

  const handleFinishLine = (e: any) => {
    if (e.other.rigidBodyObject?.name === 'player') {
      completeLap()
    }
  }

  return (
    <>
      {/* Checkpoint 1 (North Straight heading East) */}
      <GateMarker position={[0, 0, -62.5]} rotation={[0, 0, 0]} label="CP 1" color="#06b6d4" />
      <RigidBody type="fixed" sensor onIntersectionEnter={(e) => handleIntersection(e, 1)}>
        <CuboidCollider args={[1.5, 5, 14]} position={[0, 2, -62.5]} />
      </RigidBody>

      {/* Checkpoint 2 (East Straight heading South) */}
      <GateMarker position={[62.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} label="CP 2" color="#a855f7" />
      <RigidBody type="fixed" sensor onIntersectionEnter={(e) => handleIntersection(e, 2)}>
        <CuboidCollider args={[14, 5, 1.5]} position={[62.5, 2, 0]} />
      </RigidBody>

      {/* Checkpoint 3 (South Straight heading West) */}
      <GateMarker position={[0, 0, 62.5]} rotation={[0, 0, 0]} label="CP 3" color="#ec4899" />
      <RigidBody type="fixed" sensor onIntersectionEnter={(e) => handleIntersection(e, 3)}>
        <CuboidCollider args={[1.5, 5, 14]} position={[0, 2, 62.5]} />
      </RigidBody>

      {/* Checkpoint 4 (West Straight heading North) */}
      <GateMarker position={[-62.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} label="CP 4" color="#22c55e" />
      <RigidBody type="fixed" sensor onIntersectionEnter={(e) => handleIntersection(e, 4)}>
        <CuboidCollider args={[14, 5, 1.5]} position={[-62.5, 2, 0]} />
      </RigidBody>

      {/* Start / Finish Line Sensor */}
      <RigidBody type="fixed" sensor onIntersectionEnter={(e) => handleFinishLine(e)}>
        <CuboidCollider args={[1.5, 5, 14]} position={[-25, 2, -62.5]} />
      </RigidBody>
    </>
  )
}

function GateMarker({
  position,
  rotation,
  color,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  label: string
  color: string
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Arch pillars */}
      <mesh position={[0, 4, -13]}>
        <cylinderGeometry args={[0.25, 0.25, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh position={[0, 4, 13]}>
        <cylinderGeometry args={[0.25, 0.25, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Glowing Gate Overhead Arch */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 26]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
      </mesh>
    </group>
  )
}
