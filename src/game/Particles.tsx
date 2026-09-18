import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

// Module-level reusable scratch objects to eliminate GC allocations during useFrame
const _nitroQuat = new THREE.Quaternion()
const _nitroBackward = new THREE.Vector3()
const _nitroOffset = new THREE.Vector3()

const _skidVelocity = new THREE.Vector3()
const _skidQuat = new THREE.Quaternion()
const _skidRight = new THREE.Vector3()
const _skidLateral = new THREE.Vector3()
const _skidWheelPos = new THREE.Vector3()
const _skidEuler = new THREE.Euler()

interface NitroParticlesProps {
  carRef: React.RefObject<any>
  isNitroRef: React.RefObject<boolean>
}

export function NitroParticles({ carRef, isNitroRef }: NitroParticlesProps) {
  const effectiveQuality = useGameStore(state => state.effectiveQuality)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particleCount = effectiveQuality === 'low' ? 30 : effectiveQuality === 'medium' ? 60 : 120
  const spawnRate = effectiveQuality === 'low' ? 1 : effectiveQuality === 'medium' ? 2 : 3

  const particlesRef = useRef(
    Array.from({ length: 120 }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      life: 0,
      active: false,
    }))
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const spawnIndex = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current || !carRef.current) return

    try {
      const isNitroActive = !!isNitroRef.current
      const velocity = carRef.current.linvel()
      const speed = Math.hypot(velocity.x, velocity.z) * 3.6

      const carPos = carRef.current.translation()
      const carRot = carRef.current.rotation()
      _nitroQuat.set(carRot.x, carRot.y, carRot.z, carRot.w)
      _nitroBackward.set(0, 0, 1).applyQuaternion(_nitroQuat).normalize()

      const particles = particlesRef.current

      // Spawn new particles
      if (isNitroActive && speed > 20) {
        for (let i = 0; i < spawnRate; i++) {
          const p = particles[spawnIndex.current]
          p.active = true
          p.life = 1.0

          _nitroOffset.copy(_nitroBackward).multiplyScalar(2.0)
          p.position.set(carPos.x + _nitroOffset.x, carPos.y + 0.3 + _nitroOffset.y, carPos.z + _nitroOffset.z)

          const spreadX = (Math.random() - 0.5) * 5
          const spreadY = (Math.random() - 0.5) * 5
          p.velocity.copy(_nitroBackward).multiplyScalar(15 + Math.random() * 10)
          p.velocity.x += spreadX
          p.velocity.y += spreadY

          spawnIndex.current = (spawnIndex.current + 1) % particleCount
        }
      }

      // Update particles
      let hasUpdates = false
      particles.forEach((p, i) => {
        if (p.active) {
          hasUpdates = true
          p.life -= delta * 4
          p.position.addScaledVector(p.velocity, delta)

          dummy.position.copy(p.position)
          const scale = Math.max(0, p.life) * 0.5
          dummy.scale.set(scale, scale, scale)
          dummy.updateMatrix()
          meshRef.current!.setMatrixAt(i, dummy.matrix)

          if (p.life <= 0) {
            p.active = false
            dummy.scale.set(0, 0, 0)
            dummy.updateMatrix()
            meshRef.current!.setMatrixAt(i, dummy.matrix)
          }
        }
      })

      if (hasUpdates || isNitroActive) {
        meshRef.current.instanceMatrix.needsUpdate = true
      }
    } catch {
      /* ignore stale refs during unmount/reset */
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
    </instancedMesh>
  )
}

export function SkidMarks({ carRef }: { carRef: React.RefObject<any> }) {
  const effectiveQuality = useGameStore(state => state.effectiveQuality)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const isLow = effectiveQuality === 'low'
  const maxSkids = isLow ? 0 : effectiveQuality === 'medium' ? 80 : 200

  const skidsRef = useRef(
    Array.from({ length: 200 }, () => ({
      active: false,
    }))
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const spawnIndex = useRef(0)

  useFrame(() => {
    if (isLow || !meshRef.current || !carRef.current) return

    try {
      const velocity = carRef.current.linvel()
      _skidVelocity.set(velocity.x, velocity.y, velocity.z)

      if (_skidVelocity.lengthSq() < 25) return

      const carRot = carRef.current.rotation()
      _skidQuat.set(carRot.x, carRot.y, carRot.z, carRot.w)

      _skidRight.set(1, 0, 0).applyQuaternion(_skidQuat)
      _skidRight.y = 0
      if (_skidRight.lengthSq() > 0.0001) {
        _skidRight.normalize()
        _skidLateral.copy(_skidVelocity).projectOnVector(_skidRight)
      } else {
        _skidLateral.set(0,0,0)
      }

      if (_skidLateral.lengthSq() > 4) {
        const carPos = carRef.current.translation()
        _skidEuler.setFromQuaternion(_skidQuat)
        const skids = skidsRef.current

        for (let i = 0; i < 2; i++) {
          const offsetX = i === 0 ? -1.1 : 1.1
          const p = skids[spawnIndex.current]
          p.active = true

          _skidWheelPos.set(offsetX, 0, 1.5).applyQuaternion(_skidQuat)
          dummy.position.set(carPos.x + _skidWheelPos.x, 0.05, carPos.z + _skidWheelPos.z)
          dummy.rotation.copy(_skidEuler)

          dummy.scale.set(0.4, 1, 0.4 + Math.random() * 0.4)
          dummy.updateMatrix()
          meshRef.current!.setMatrixAt(spawnIndex.current, dummy.matrix)

          spawnIndex.current = (spawnIndex.current + 1) % maxSkids
        }

        meshRef.current.instanceMatrix.needsUpdate = true
      }
    } catch {
      /* ignore stale refs */
    }
  })

  if (isLow) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxSkids]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#050505" transparent opacity={0.6} depthWrite={false} />
    </instancedMesh>
  )
}
