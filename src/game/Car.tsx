import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import { useKeyboardControls, useGLTF } from '@react-three/drei'
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier'
import { useGameStore } from '../store/useGameStore'
import { NitroParticles, SkidMarks } from './Particles'
import * as THREE from 'three'

// Preload the Mini Cooper model
useGLTF.preload('/Mini cooper.glb')

import { EnhancedCarModel, CAR_VARIANTS, type VehicleState } from './EnhancedCarModel'
const CAR_SPECS = {
  neon: { color: '#7c22ce', mass: 1200, accel: 45.0, topSpeed: 180, handling: 1.5, grip: 6.0 },
  muscle: { color: '#ff3b3b', mass: 1500, accel: 55.0, topSpeed: 200, handling: 1.0, grip: 4.0 },
  drift: { color: '#3bff65', mass: 1000, accel: 40.0, topSpeed: 160, handling: 2.5, grip: 2.0 }
}

import { soundEngine } from '../audio/SoundEngine'

// Module-level scratch objects for useFrame physics and camera
const vec3 = new THREE.Vector3()
const quaternion = new THREE.Quaternion()
const forwardVector = new THREE.Vector3()
const rightVector = new THREE.Vector3()
const horizontalVelocity = new THREE.Vector3()
const lateralVelocity = new THREE.Vector3()
const brakeForce = new THREE.Vector3()
const force = new THREE.Vector3()
const dragImpulse = new THREE.Vector3()

// Camera variables
const lookAtPos = new THREE.Vector3()
const targetCameraQuaternion = new THREE.Quaternion()
const lookAheadVector = new THREE.Vector3()
const camOffsetChase = new THREE.Vector3(0, 2.7, 7.8)
const lookOffsetChase = new THREE.Vector3(0, 1.15, 0)
const camOffsetHood = new THREE.Vector3(0, 0.75, -1.25)
const lookOffsetHood = new THREE.Vector3(0, 0.75, -6)
const camOffsetCinematic = new THREE.Vector3(0, 6.5, 14)
const lookOffsetCinematic = new THREE.Vector3(0, 2, 0)
const desiredVel = new THREE.Vector3()
const velocityDifference = new THREE.Vector3()

function respawnCar(body: RapierRigidBody) {
  try {
    const currentPos = body.translation()
    const cx = Math.max(-62.5, Math.min(62.5, currentPos.x))
    const cz = Math.max(-62.5, Math.min(62.5, currentPos.z))

    // Determine nearest track straight and face correct direction
    if (cz < 0 && Math.abs(cz) >= Math.abs(cx)) {
      // North straight: face East (+X)
      body.setTranslation({ x: Math.max(-55, Math.min(55, cx)), y: 0.8, z: -62.5 }, true)
      body.setRotation({ x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }, true)
    } else if (cx > 0 && Math.abs(cx) > Math.abs(cz)) {
      // East straight: face South (+Z)
      body.setTranslation({ x: 62.5, y: 0.8, z: Math.max(-55, Math.min(55, cz)) }, true)
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    } else if (cz > 0 && Math.abs(cz) >= Math.abs(cx)) {
      // South straight: face West (-X)
      body.setTranslation({ x: Math.max(-55, Math.min(55, cx)), y: 0.8, z: 62.5 }, true)
      body.setRotation({ x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }, true)
    } else {
      // West straight: face North (-Z)
      body.setTranslation({ x: -62.5, y: 0.8, z: Math.max(-55, Math.min(55, cz)) }, true)
      body.setRotation({ x: 0, y: 1, z: 0, w: 0 }, true)
    }

    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  } catch {
    /* safely ignore invalid WASM pointer */
  }
}

export function Car() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const [subscribeKeys, getKeys] = useKeyboardControls()
  const selectedCar = useGameStore(s => s.selectedCar)
  const isGameOver = useGameStore(s => s.isGameOver)
  const effectiveQuality = useGameStore(s => s.effectiveQuality)
  const setPlayerRef = useGameStore(s => s.setPlayerRef)
  const cycleCamera = useGameStore(s => s.cycleCamera)
  
  const nitroRef = useRef(100)
  const isNitroRef = useRef(false)
  
  const vehicleStateRef = useRef<VehicleState>({ speed: 0, isBraking: false, isNitro: false, steering: 0 })
  const isInitialCameraSet = useRef(false)
  const driftStartTime = useRef<number | null>(null)
  const lastStoreSync = useRef(0)
  const hasStartedAudio = useRef(false)
  const steeringValue = useRef(0)
  const carMeshRef = useRef<THREE.Group>(null)

  // Register ref on mount and subscribe to camera & respawn keys
  useEffect(() => {
    setPlayerRef(bodyRef)
    
    // Explicitly set initial position and rotation facing East (+X)
    bodyRef.current?.setTranslation({ x: -30, y: 0.8, z: -62.5 }, true)
    bodyRef.current?.setRotation({ x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }, true)

    const unsubCamera = subscribeKeys(
      (state: any) => state.camera,
      (pressed) => {
        if (pressed) cycleCamera()
      }
    )

    const unsubRespawn = subscribeKeys(
      (state: any) => state.respawn,
      (pressed) => {
        if (pressed && bodyRef.current) {
          respawnCar(bodyRef.current)
        }
      }
    )

    return () => {
      unsubCamera()
      unsubRespawn()
    }
  }, [setPlayerRef, subscribeKeys, cycleCamera])

  // Stop engine sound on unmount or game over
  useEffect(() => {
    if (isGameOver) {
      soundEngine.mute(true)
    }
    return () => soundEngine.mute(true)
  }, [isGameOver])

  const specs = CAR_SPECS[selectedCar as keyof typeof CAR_SPECS] || CAR_SPECS.neon

  // Car specs — boosted steering for arcade feel
  const turnSpeed = 4.0 * specs.handling
  const grip = specs.grip
  const angularDamping = 2.5

  useFrame((state, delta) => {
    if (!bodyRef.current) return
    try {
      const mass = bodyRef.current.mass()
      const keys = getKeys()
      const { brake } = keys
    const store = useGameStore.getState()
    const isRaceStarted = store.isRaceStarted
    const _forward = isRaceStarted ? keys.forward : false
    const _backward = isRaceStarted ? keys.backward : false
    const _left = isRaceStarted ? keys.left : false
    const _right = isRaceStarted ? keys.right : false
    const isNitro = isRaceStarted && (keys as any).nitro && nitroRef.current > 0 && _forward
    isNitroRef.current = !!isNitro
    
    if ((_forward || _backward || _left || _right) && !hasStartedAudio.current) {
      soundEngine.init()
      soundEngine.mute(false)
      hasStartedAudio.current = true
    }
    
    const safeDelta = Math.min(delta, 0.1)

    // Keep car locked in place on starting grid until race officially starts
    if (!isRaceStarted) {
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    // Nitro logic via local ref
    if (isNitro) {
      nitroRef.current = Math.max(0, nitroRef.current - 20 * safeDelta)
    } else if (nitroRef.current < 100) {
      nitroRef.current = Math.min(100, nitroRef.current + 5 * safeDelta)
    }

    // Get current velocity and rotation
    const velocity = bodyRef.current.linvel()
    const rotation = bodyRef.current.rotation()
    quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    
    // Forward direction vector
    forwardVector.set(0, 0, -1).applyQuaternion(quaternion)
    forwardVector.y = 0
    forwardVector.normalize()
    
    // Right direction vector
    rightVector.set(1, 0, 0).applyQuaternion(quaternion)
    rightVector.y = 0
    rightVector.normalize()

    // Current speed (horizontal plane only)    // Current velocity vectors
    horizontalVelocity.set(velocity.x, 0, velocity.z)
    lateralVelocity.copy(rightVector).multiplyScalar(horizontalVelocity.dot(rightVector))
    const isMovingForward = horizontalVelocity.dot(forwardVector) > 0
    
    // Calculate km/h
    const currentSpeed = horizontalVelocity.length()
    const speedKmH = currentSpeed * 3.6

    // Update sound engine
    if (hasStartedAudio.current) {
      soundEngine.setEngine(currentSpeed / (specs.topSpeed / 3.6), isNitro)
    }

    // Keep car grounded - suppress excessive upward launch on wall collision
    if (velocity.y > 2.5) {
      bodyRef.current.setLinvel({ x: velocity.x, y: 0.1, z: velocity.z }, true)
    }

    // Out of bounds reset guard
    const currentPos = bodyRef.current.translation()
    if (currentPos.y < -5 || currentPos.y > 30 || Math.abs(currentPos.x) > 200 || Math.abs(currentPos.z) > 200) {
      respawnCar(bodyRef.current)
    }

    // Anti-roll
    const angVel = bodyRef.current.angvel()
    bodyRef.current.setAngvel({
      x: angVel.x * (1 - safeDelta * angularDamping),
      y: angVel.y,
      z: angVel.z * (1 - safeDelta * angularDamping)
    }, true)

    // Artificial downforce
    bodyRef.current.applyImpulse({ x: 0, y: -mass * 10 * safeDelta, z: 0 }, true)

    // Dynamic Gear shifting
    const GEARS = [
      { maxSpeed: specs.topSpeed * 0.25, accel: specs.accel },
      { maxSpeed: specs.topSpeed * 0.45, accel: specs.accel * 0.75 },
      { maxSpeed: specs.topSpeed * 0.65, accel: specs.accel * 0.5 },
      { maxSpeed: specs.topSpeed * 0.85, accel: specs.accel * 0.35 },
      { maxSpeed: specs.topSpeed, accel: specs.accel * 0.25 },
      { maxSpeed: specs.topSpeed + 30, accel: specs.accel * 1.25 }
    ]

    let currentGearIndex = 0
    let displayGear: number | string = 1
    if (_backward && currentSpeed < 5) {
      displayGear = 'R'
      currentGearIndex = 0 
    } else {
      for (let i = 0; i < 5; i++) {
        if (speedKmH <= GEARS[i].maxSpeed + 2) {
          currentGearIndex = i
          break
        }
        currentGearIndex = 4
      }
      if (isNitro) currentGearIndex = 5
      displayGear = isNitro ? 'N' : currentGearIndex + 1
    }

    // Update vehicle visual state
    vehicleStateRef.current = {
      speed: currentSpeed,
      isBraking: brake || (isMovingForward && _backward),
      isReversing: _backward && !isMovingForward,
      isNitro: isNitroRef.current,
      steering: steeringValue.current
    }

    const currentGearObj = GEARS[currentGearIndex]
    const maxSpeed = isNitro ? specs.topSpeed + 30 : specs.topSpeed

    // Acceleration
    let engineAccel = 0
    if (_forward && !_backward) {
      if (!isMovingForward || speedKmH < maxSpeed) {
        const gearBase = currentGearIndex === 0 ? 0 : GEARS[currentGearIndex - 1].maxSpeed
        const gearRange = currentGearObj.maxSpeed - gearBase
        const speedInGear = Math.max(0, speedKmH - gearBase)
        const ratio = Math.pow(Math.min(1, speedInGear / gearRange), 2)
        
        engineAccel += currentGearObj.accel * (1 - ratio * 0.2)
      }
    } else if (_backward && !_forward) {
      if (isMovingForward && speedKmH > 5) {
        engineAccel -= 10.0 // Strong brake
      } else if (!isMovingForward && speedKmH < 30) {
        engineAccel -= GEARS[0].accel * 0.5 // Reverse
      } else if (isMovingForward && speedKmH <= 5) {
        engineAccel -= GEARS[0].accel * 0.5
      }
    }

    // Braking (Spacebar)
    if (brake && currentSpeed > 1) {
      brakeForce.copy(horizontalVelocity).normalize().multiplyScalar(-8.0 * mass * safeDelta)
      bodyRef.current.applyImpulse(brakeForce, true)
    }

    // Apply engine forward force
    force.copy(forwardVector).multiplyScalar(engineAccel * mass * safeDelta)
    bodyRef.current.applyImpulse(force, true)

    // Steering — snappy arcade turning
    if (currentSpeed > 0.1 || _forward || _backward) {
      const turnDir = _left ? 1 : _right ? -1 : 0
      // Keep strong steering even at high speeds
      const speedFactor = Math.max(0.45, 1 - (currentSpeed / 140))
      const turnMultiplier = (_backward && !isMovingForward) ? -1 : 1
      force.set(0, turnDir * turnSpeed * turnMultiplier * speedFactor * mass * 2.5, 0)
      bodyRef.current.applyTorqueImpulse(force.multiplyScalar(safeDelta * 2), true)
    }

    // Tire grip (Arcade style: rotate velocity vector instead of just applying drag)
    const latSpeed = lateralVelocity.length()
    if (hasStartedAudio.current) {
      if (latSpeed > 2.0 || (brake && currentSpeed > 5)) {
        soundEngine.setSkid(Math.min(1.0, latSpeed / 10 + (brake ? 0.5 : 0)))
      } else {
        soundEngine.setSkid(0)
      }
    }
    
    // Drift statistics tracking
    const isDrifting = Math.abs(latSpeed) > 8.0 && currentSpeed > 10.0
    if (isDrifting) {
      if (driftStartTime.current === null) {
        driftStartTime.current = state.clock.elapsedTime
      }
    } else {
      if (driftStartTime.current !== null) {
        const driftDuration = state.clock.elapsedTime - driftStartTime.current
        if (driftDuration > 0.3) {
          store.setLongestDrift(driftDuration)
        }
        driftStartTime.current = null
      }
    }

    // Arcade Handling: Rotate the velocity vector towards where the car is facing via Impulse (Zero GC allocations)
    if (currentSpeed > 1.0 && isMovingForward) {
      const turnGrip = brake ? grip * 0.3 : grip
      desiredVel.copy(forwardVector).multiplyScalar(currentSpeed)
      velocityDifference.subVectors(desiredVel, horizontalVelocity)
      
      const correctionImpulse = velocityDifference.multiplyScalar(turnGrip * safeDelta * mass)
      bodyRef.current.applyImpulse(correctionImpulse, true)
    }

    // Aerodynamic drag
    const dragRatio = Math.min(0.2, 0.0036 * currentSpeed * safeDelta * 3)
    dragImpulse.copy(horizontalVelocity).multiplyScalar(-dragRatio * mass)
    bodyRef.current.applyImpulse(dragImpulse, true)

    // Throttle store synchronization to avoid React 60-120fps re-render thrashing
    if (state.clock.elapsedTime - lastStoreSync.current > 0.08) {
      lastStoreSync.current = state.clock.elapsedTime
      store.setSpeed(speedKmH)
      store.setNitro(nitroRef.current)
      store.setGear(displayGear)
    }

    // Camera follow - Bulletproof Constant Distance method
    const cameraMode = store.cameraMode
    let camOffset = camOffsetChase
    let lookOffset = lookOffsetChase
    
    if (cameraMode === 'hood') {
      camOffset = camOffsetHood
      lookOffset = lookOffsetHood
    } else if (cameraMode === 'cinematic') {
      camOffset = camOffsetCinematic
      lookOffset = lookOffsetCinematic
    }

    // Smoothly interpolate the camera's reference rotation (increased responsiveness based on user feedback)
    const rotLerpSpeed = cameraMode === 'chase' ? 15.0 : cameraMode === 'hood' ? 30.0 : 4.0;
    
    (window as any).__threeScene = state.scene;

    if (!isInitialCameraSet.current) {
      bodyRef.current.setTranslation({ x: -30, y: 0.8, z: -62.5 }, true)
      bodyRef.current.setRotation({ x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }, true)
      targetCameraQuaternion.set(0, -Math.SQRT1_2, 0, Math.SQRT1_2)
      isInitialCameraSet.current = true
    } else {
      targetCameraQuaternion.slerp(quaternion, rotLerpSpeed * safeDelta)
    }

    // 1) Position: Exactly offset from the car using the SMOOTHED rotation
    vec3.copy(camOffset).applyQuaternion(targetCameraQuaternion).add(bodyRef.current.translation() as THREE.Vector3)
    state.camera.position.copy(vec3)

    // 2) LookAt: Look down the straight through and ahead of the car
    const lookAheadDist = Math.max(10.0, currentSpeed * 0.4)
    lookAheadVector.set(0, 0, -1).applyQuaternion(targetCameraQuaternion).multiplyScalar(lookAheadDist)
    
    lookAtPos.copy(bodyRef.current.translation() as THREE.Vector3).add(lookOffset).add(lookAheadVector)
    state.camera.lookAt(lookAtPos)
    
    // Dynamic FOV for speed sensation (subtle) — only update projection matrix on significant change
    const cam = state.camera as THREE.PerspectiveCamera
    const targetFov = 60 + (currentSpeed * 0.1) + (isNitro ? 5 : 0)
    const newFov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.1)
    if (Math.abs(newFov - cam.fov) > 0.3) {
      cam.fov = newFov
      cam.updateProjectionMatrix()
    }
    } catch {
      /* ignore stale handles during remount */
    }
  })

  return (
    <>
    <RigidBody 
      ref={bodyRef} 
      position={[-30, 0.8, -62.5]} 
      rotation={[0, -Math.PI / 2, 0]} // Face +X direction
      angularDamping={angularDamping}
      linearDamping={0.1}
      friction={0}
      restitution={0.1}
      enabledRotations={[false, true, false]}
      name="player"
    >
      <CuboidCollider args={[1, 0.4, 2]} density={specs.mass / 6.4} />
      <group>
        <group ref={carMeshRef}>
          <EnhancedCarModel 
            variant={selectedCar as keyof typeof CAR_VARIANTS} 
            isPlayer={true}
            vehicleStateRef={vehicleStateRef}
          />
        </group>

        {/* Rear Neon Underglow Bar & Ground Glow */}
        <mesh position={[0, -0.32, 1.45]}>
          <boxGeometry args={[1.2, 0.03, 0.05]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={5} />
        </mesh>
        {effectiveQuality === 'high' && (
          <>
            <pointLight position={[0, -0.2, 1.45]} color="#ec4899" intensity={4} distance={6} decay={2} />
            <pointLight position={[0, -0.1, 0]} color="#ec4899" intensity={2} distance={5} decay={2} />
          </>
        )}

        {/* Front Headlights Illuminating Track Ahead */}
        {effectiveQuality !== 'low' && (
          <pointLight position={[0, 0.35, -2.6]} color="#f8fafc" intensity={effectiveQuality === 'high' ? 5 : 3} distance={effectiveQuality === 'high' ? 28 : 18} decay={1.3} />
        )}
        <mesh position={[-0.55, 0.15, -1.85]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} />
        </mesh>
        <mesh position={[0.55, 0.15, -1.85]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} />
        </mesh>
      </group>
    </RigidBody>
    <NitroParticles carRef={bodyRef} isNitroRef={isNitroRef} />
    <SkidMarks carRef={bodyRef} />
    </>
  )
}
