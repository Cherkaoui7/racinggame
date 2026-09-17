import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

export const carVisualFeatures = {
  enhancedPaint: true,
  enhancedGlass: true,
  enhancedLights: true
}

// Centralized configuration for variants
export const CAR_VARIANTS = {
  neon: { bodyColor: '#5B18FF', underglowColor: '#00E5FF', accentColor: '#00E5FF', wheelAccentColor: '#151515' },
  muscle: { bodyColor: '#E51B23', underglowColor: '#FF1744', accentColor: '#00E5FF', wheelAccentColor: '#151515' },
  drift: { bodyColor: '#21C45A', underglowColor: '#39FF88', accentColor: '#00E5FF', wheelAccentColor: '#151515' }
}

type CarVariant = keyof typeof CAR_VARIANTS

export interface VehicleState {
  speed: number
  isBraking: boolean
  isNitro: boolean
  steering: number
}

interface EnhancedCarModelProps {
  color?: string
  variant?: CarVariant | string
  isPlayer?: boolean
  vehicleStateRef?: React.MutableRefObject<VehicleState>
  opacity?: number
}

// Shared Materials cache to prevent memory leaks and state thrashing
const materialsCache = {
  blackPlastic: new THREE.MeshStandardMaterial({
    color: '#111111',
    roughness: 0.8,
    metalness: 0.1,
  }),
  aiGlass: new THREE.MeshStandardMaterial({
    color: '#020408',
    roughness: 0.2,
    metalness: 0.8,
  }),
  carbon: new THREE.MeshStandardMaterial({
    color: '#111111',
    roughness: 0.6,
    metalness: 0.8,
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: '#050a12',
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0,
    transparent: false, // Opaque glass saves performance
  }),
  brakeDisc: new THREE.MeshStandardMaterial({
    color: '#888888',
    metalness: 0.9,
    roughness: 0.4,
  }),
  caliper: new THREE.MeshStandardMaterial({
    color: '#FF1744',
    roughness: 0.5,
    metalness: 0.5,
  }),
  exhaust: new THREE.MeshStandardMaterial({
    color: '#222222',
    metalness: 0.9,
    roughness: 0.3,
  }),
  whiteEmissive: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 2.0,
    toneMapped: false,
  }),
  redEmissive: new THREE.MeshStandardMaterial({
    color: '#ff0000',
    emissive: '#ff0000',
    emissiveIntensity: 1.0,
    toneMapped: false,
  })
}

export function EnhancedCarModel({ 
  color,
  variant = 'neon', 
  isPlayer = false, 
  vehicleStateRef,
  opacity = 1.0
}: EnhancedCarModelProps) {
  const { scene } = useGLTF('/Mini cooper.glb')
  const effectiveQuality = useGameStore((state) => state.effectiveQuality)
  const isLow = effectiveQuality === 'low'

  const config = CAR_VARIANTS[variant as CarVariant] || CAR_VARIANTS.neon
  const targetBodyColor = color ? new THREE.Color(color) : new THREE.Color(config.bodyColor)

  const groupRef = useRef<THREE.Group>(null)
  const brakeLightRefs = useRef<THREE.Mesh[]>([])

  const clonedScene = useMemo(() => {
    // 1. Create shared materials for this specific car instance ONCE
    // AI cars get a much cheaper standard material without clearcoat
    const usePhysical = isPlayer && !isLow && carVisualFeatures.enhancedPaint

    const carBodyMaterial = usePhysical 
      ? new THREE.MeshPhysicalMaterial({
          color: targetBodyColor,
          metalness: 0.85,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          transparent: opacity < 1.0,
          opacity: opacity
        })
      : new THREE.MeshStandardMaterial({
          color: targetBodyColor,
          metalness: 0.8,
          roughness: 0.3,
          transparent: opacity < 1.0,
          opacity: opacity
        })

    const carTailLightMaterial = materialsCache.redEmissive.clone()
    let tailLightTracked = false

    const clone = scene.clone(true)

    clone.traverse((child) => {
      if (child.name === 'Plane') {
        child.visible = false
        return
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.Material | undefined
        const name = ((mat?.name || '') + ' ' + (mesh.name || '')).toLowerCase()

        // Opacity
        if (opacity < 1.0 && mat && !Array.isArray(mat)) {
          mat.transparent = true
          mat.opacity = opacity
        }

        // Culling logic
        const isInteriorOrExcess = 
          name.includes('interior') || name.includes('seat') || name.includes('das') ||
          name.includes('rubber') || name.includes('hole') || name.includes('fab') ||
          name.includes('pedal') || name.includes('engine') || name.includes('motor') ||
          name.includes('suspension') || name.includes('radiator') || name.includes('battery') ||
          name.includes('axle') || name.includes('chassis') || name.includes('underbody') ||
          name.includes('floor') || name.includes('wiper')

        if (isInteriorOrExcess && (!isPlayer || isLow)) {
          mesh.visible = false
          return
        }

        if (mesh.geometry?.attributes?.position) {
          const vCount = mesh.geometry.attributes.position.count
          if (isLow ? vCount < 120 : vCount < 70) {
            mesh.visible = false
            return
          }
        }

        // PBR Body Paint
        const isColoredBodyPart = name.includes('paint') || name.includes('body') || name.includes('roof')
        if (isColoredBodyPart) {
          // ALWAYS use the shared material instance to guarantee minimal draw calls!
          mesh.material = carBodyMaterial
          return
        }

        // Premium Glass
        const isGlass = name.includes('glass') || name.includes('window')
        if (isGlass) {
          if (carVisualFeatures.enhancedGlass && isPlayer) {
             mesh.material = materialsCache.glass
          } else {
             mesh.material = materialsCache.aiGlass
          }
          return
        }

        // Headlights
        const isHeadlight = name.includes('headlight')
        if (isHeadlight && !name.includes('hole') && carVisualFeatures.enhancedLights) {
          mesh.material = materialsCache.whiteEmissive
          return
        }

        // Tail Lights
        const isTailLight = name.includes('tail_light')
        if (isTailLight && carVisualFeatures.enhancedLights) {
          mesh.material = carTailLightMaterial
          if (!tailLightTracked) {
             brakeLightRefs.current.push(mesh) // We only need to track one mesh since the material is shared!
             tailLightTracked = true
          }
          return
        }

        // Wheels / Chrome tweaks
        if (name.includes('wheel') || name.includes('chrome')) {
          if (mesh.material && !Array.isArray(mesh.material)) {
            // Modify the shared material safely without cloning every frame
            // Since useGLTF returns shared materials, we'll just mutate it once.
            // But React StrictMode might run this twice, so we check if we already tweaked it.
            const m = mesh.material as THREE.MeshStandardMaterial
            if (m.metalness !== 0.9) {
               const newMat = m.clone()
               newMat.metalness = 0.9
               newMat.roughness = 0.3
               mesh.material = newMat
            }
          }
        }
      }
    })
    return clone
  }, [scene, targetBodyColor, isLow, isPlayer, opacity])

  useFrame((_, delta) => {
    const state = vehicleStateRef?.current
    const speed = state?.speed || 0
    const isBraking = state?.isBraking || false
    const steering = state?.steering || 0

    // 1. Dynamic Brake Lights
    if (carVisualFeatures.enhancedLights && brakeLightRefs.current.length > 0) {
      const targetBrakeIntensity = isBraking ? 5.0 : 1.0
      // Since all tail lights on a car share the same material, we only update the tracked mesh's material once!
      brakeLightRefs.current.forEach(mesh => {
        if (mesh.material) {
           const mat = mesh.material as THREE.MeshStandardMaterial
           mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetBrakeIntensity, delta * 15)
        }
      })
    }

    // 2. Chassis Animation (Pitch/Roll based on acceleration/cornering)
    if (groupRef.current && isPlayer) {
      // Very subtle pitch backwards on accel, forwards on brake
      const targetPitch = isBraking ? -0.02 : (speed > 10 ? 0.01 : 0)
      const targetRoll = steering * 0.03 * Math.min(1.0, speed / 50)
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetPitch, delta * 5)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRoll, delta * 5)
    }
  })

  return (
    <group ref={groupRef}>
      <primitive 
        object={clonedScene} 
        scale={1}
        position={[0, -0.4, 0]} 
        rotation={[0, Math.PI, 0]}
      />
    </group>
  )
}
