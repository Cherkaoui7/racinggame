import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier'
import { useGameStore } from '../store/useGameStore'
import * as THREE from 'three'

import { EnhancedCarModel, type VehicleState } from './EnhancedCarModel'

interface CircuitWaypoint {
  pos: THREE.Vector3
  speed: number
}

const CIRCUIT_WAYPOINTS: CircuitWaypoint[] = [
  // 1. North Straight (Heading East +X towards Turn 1)
  { pos: new THREE.Vector3(-15, 1, -62.5), speed: 175 },
  { pos: new THREE.Vector3(15, 1, -62.5), speed: 175 },
  { pos: new THREE.Vector3(38, 1, -62.5), speed: 155 },
  // Turn 1 Arc (North to East, inner curb at 50, -50)
  { pos: new THREE.Vector3(53, 1, -63.5), speed: 105 },
  { pos: new THREE.Vector3(61, 1, -61), speed: 80 },
  { pos: new THREE.Vector3(63.5, 1, -53), speed: 100 },
  // 2. East Straight (Heading South +Z towards Turn 2)
  { pos: new THREE.Vector3(62.5, 1, -38), speed: 155 },
  { pos: new THREE.Vector3(62.5, 1, 0), speed: 175 },
  { pos: new THREE.Vector3(62.5, 1, 38), speed: 155 },
  // Turn 2 Arc (East to South, inner curb at 50, 50)
  { pos: new THREE.Vector3(63.5, 1, 53), speed: 105 },
  { pos: new THREE.Vector3(61, 1, 61), speed: 80 },
  { pos: new THREE.Vector3(53, 1, 63.5), speed: 100 },
  // 3. South Straight (Heading West -X towards Turn 3)
  { pos: new THREE.Vector3(38, 1, 62.5), speed: 155 },
  { pos: new THREE.Vector3(0, 1, 62.5), speed: 175 },
  { pos: new THREE.Vector3(-38, 1, 62.5), speed: 155 },
  // Turn 3 Arc (South to West, inner curb at -50, 50)
  { pos: new THREE.Vector3(-53, 1, 63.5), speed: 105 },
  { pos: new THREE.Vector3(-61, 1, 61), speed: 80 },
  { pos: new THREE.Vector3(-63.5, 1, 53), speed: 100 },
  // 4. West Straight (Heading North -Z towards Turn 4)
  { pos: new THREE.Vector3(-62.5, 1, 38), speed: 155 },
  { pos: new THREE.Vector3(-62.5, 1, 0), speed: 175 },
  { pos: new THREE.Vector3(-62.5, 1, -35), speed: 155 },
  // Turn 4 Arc (West to North, inner curb at -50, -50)
  { pos: new THREE.Vector3(-63.5, 1, -50), speed: 105 },
  { pos: new THREE.Vector3(-61, 1, -61), speed: 80 },
  { pos: new THREE.Vector3(-50, 1, -63.5), speed: 100 },
  // North Straight Pre-Start approach
  { pos: new THREE.Vector3(-32, 1, -62.5), speed: 160 },
]

// Each AICar instance gets its own scratch workspace via useMemo
function createScratch() {
  return {
    posVector: new THREE.Vector3(),
    targetPos: new THREE.Vector3(),
    directionToTarget: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    forwardVector: new THREE.Vector3(),
    rightVector: new THREE.Vector3(),
    currentVelocity: new THREE.Vector3(),
    force: new THREE.Vector3(),
    torque: new THREE.Vector3(),
    dragImpulse: new THREE.Vector3(),
    tempForward: new THREE.Vector3(),
    tempDirection: new THREE.Vector3(),
    aiDesiredVel: new THREE.Vector3(),
    aiHorizontalVel: new THREE.Vector3(),
    aiVelocityDiff: new THREE.Vector3(),
    trackTangent: new THREE.Vector3(),
    trackNormal: new THREE.Vector3(),
    toWpVec: new THREE.Vector3(),
    recoverDir: new THREE.Vector3(),
  }
}

export interface AICarProps {
  id: string
  name: string
  color: string
  initialPosition: [number, number, number]
  speedMultiplier?: number
  laneOffset?: number
}

export function AICar({
  id,
  name,
  color,
  initialPosition,
  speedMultiplier = 1,
  laneOffset = 0,
}: AICarProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const stuckTimer = useRef(0)
  const currentWaypoint = useRef(0)
  const lapRef = useRef(1)
  const prevXRef = useRef(initialPosition[0])
  const hasTraversedHalf = useRef(false)
  const vehicleStateRef = useRef<VehicleState>({ speed: 0, isBraking: false, isNitro: false, steering: 0 })
  const addAIRef = useGameStore(s => s.addAIRef)
  const difficulty = useGameStore(s => s.difficulty)
  const scratch = useMemo(() => createScratch(), [])

  useEffect(() => {
    addAIRef(bodyRef)
    if (bodyRef.current) {
      const b = bodyRef.current as any
      b.__racerId = id
      b.__racerName = name
      b.__racerColor = color
      b.__lap = 1
    }
  }, [addAIRef, id, name, color])

  // Difficulty multipliers
  const diffMult = difficulty === 'hard' ? 1.05 : difficulty === 'medium' ? 0.90 : 0.72
  const turnDiffMult = difficulty === 'hard' ? 1.15 : difficulty === 'medium' ? 1.0 : 0.8

  // Car specs
  const turnSpeed = 2.6 * turnDiffMult
  const accel = 34.0 * diffMult
  const maxSpeed = 175 * speedMultiplier * diffMult
  const grip = 6.0

  const frameCount = useRef(0)

  useFrame((state, delta) => {
    if (!bodyRef.current) return
    const isRaceStarted = useGameStore.getState().isRaceStarted
    if (!isRaceStarted) return

    frameCount.current++

    try {
      const { posVector, targetPos, directionToTarget, quaternion, forwardVector, rightVector,
        currentVelocity, force, torque, dragImpulse, tempForward, tempDirection,
        aiDesiredVel, aiHorizontalVel, aiVelocityDiff, trackTangent, trackNormal,
        toWpVec, recoverDir } = scratch

      const currentPos = bodyRef.current.translation()
      posVector.set(currentPos.x, currentPos.y, currentPos.z)

      // LOD Physics Culling: Reduce tick rate for distant cars
      const distSqToCamera = posVector.distanceToSquared(state.camera.position)
      let effectiveDelta = delta

      if (distSqToCamera > 10000) { // ~100m away
        if (frameCount.current % 3 !== 0) return // 20 FPS physics
        effectiveDelta *= 3
      } else if (distSqToCamera > 4000) { // ~63m away
        if (frameCount.current % 2 !== 0) return // 30 FPS physics
        effectiveDelta *= 2
      }

      const wp = CIRCUIT_WAYPOINTS[currentWaypoint.current]
      const nextWp = CIRCUIT_WAYPOINTS[(currentWaypoint.current + 1) % CIRCUIT_WAYPOINTS.length]

      // Physical Start/Finish line crossing detection at x = -25 moving East (+X) on the North straight
      const prevX = prevXRef.current
      const currX = currentPos.x
      prevXRef.current = currX

      // Arm lap trigger once the car traverses past the South straight (z > 40)
      if (currentPos.z > 40) {
        hasTraversedHalf.current = true
      }

      // Increment lap ONLY when crossing the actual physical Start/Finish line
      if (hasTraversedHalf.current && prevX < -25 && currX >= -25 && Math.abs(currentPos.z - (-62.5)) < 14) {
        hasTraversedHalf.current = false
        lapRef.current += 1
        if (bodyRef.current) {
          (bodyRef.current as any).__lap = lapRef.current
        }
      }

      // Calculate track tangent and lateral normal vector for lane positioning
      trackTangent.subVectors(nextWp.pos, wp.pos).setY(0).normalize()
      trackNormal.set(trackTangent.z, 0, -trackTangent.x)

      // Designated lane offset target
      targetPos.copy(wp.pos).addScaledVector(trackNormal, laneOffset)

      // Check if car reached or moved past the waypoint
      const distToTarget = posVector.distanceTo(targetPos)
      toWpVec.subVectors(posVector, targetPos)
      const isPastTarget = toWpVec.dot(trackTangent) > 0

      if (distToTarget < 13.0 || (isPastTarget && distToTarget < 20.0)) {
        currentWaypoint.current = (currentWaypoint.current + 1) % CIRCUIT_WAYPOINTS.length
      }

      // Out of bounds reset
      if (currentPos.y < -3 || currentPos.y > 25 || Math.abs(currentPos.x) > 120 || Math.abs(currentPos.z) > 120) {
        const respawnWp = CIRCUIT_WAYPOINTS[currentWaypoint.current]
        bodyRef.current.setTranslation({ x: respawnWp.pos.x, y: 0.8, z: respawnWp.pos.z }, true)
        bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }

      // Direction to target
      directionToTarget.subVectors(targetPos, posVector).normalize()

      // Current velocity & rotation
      const velocity = bodyRef.current.linvel()
      if (velocity.y > 2.0) {
        bodyRef.current.setLinvel({ x: velocity.x, y: 0.1, z: velocity.z }, true)
      }
      const rotation = bodyRef.current.rotation()
      quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)

      forwardVector.set(0, 0, -1).applyQuaternion(quaternion)
      forwardVector.y = 0
      forwardVector.normalize()

      rightVector.set(1, 0, 0).applyQuaternion(quaternion)
      rightVector.y = 0
      rightVector.normalize()

      currentVelocity.set(velocity.x, velocity.y, velocity.z)
      const currentSpeed = currentVelocity.length()
      const speedKmH = currentSpeed * 3.6

      // Multi-Car Collision Avoidance & Anti-Ramming (no array allocation)
      let avoidanceSteer = 0
      let speedCap = wp.speed

      const store = useGameStore.getState()
      const aiRefsList = store.aiRefs
      const playerRefVal = store.playerRef

      // Check player first
      if (playerRefVal?.current && playerRefVal.current !== bodyRef.current) {
        const cPos = playerRefVal.current.translation()
        const dx = cPos.x - currentPos.x
        const dz = cPos.z - currentPos.z
        const distSq = dx * dx + dz * dz
        if (distSq < 144) {
          const fDist = dx * forwardVector.x + dz * forwardVector.z
          const lDist = dx * rightVector.x + dz * rightVector.z
          if (fDist > 0.5 && fDist < 10.0 && Math.abs(lDist) < 2.8) {
            avoidanceSteer += lDist >= 0 ? -1.0 : 1.0
            if (fDist < 4.0) speedCap = Math.min(speedCap, 35)
            else if (fDist < 7.0) speedCap = Math.min(speedCap, 75)
          }
        }
      }

      // Check AI refs (no spread operator - iterate directly)
      for (let i = 0; i < aiRefsList.length; i++) {
        const cRef = aiRefsList[i]
        if (!cRef?.current || cRef.current === bodyRef.current) continue
        const cPos = cRef.current.translation()
        const dx = cPos.x - currentPos.x
        const dz = cPos.z - currentPos.z
        const distSq = dx * dx + dz * dz
        if (distSq > 144) continue

        const fDist = dx * forwardVector.x + dz * forwardVector.z
        const lDist = dx * rightVector.x + dz * rightVector.z

        if (fDist > 0.5 && fDist < 10.0 && Math.abs(lDist) < 2.8) {
          avoidanceSteer += lDist >= 0 ? -1.0 : 1.0
          if (fDist < 4.0) speedCap = Math.min(speedCap, 35)
          else if (fDist < 7.0) speedCap = Math.min(speedCap, 75)
        }
      }

      // Proportional Steering AI
      tempForward.copy(forwardVector).setY(0).normalize()
      tempDirection.copy(directionToTarget).setY(0).normalize()
      const angleDiff = tempForward.cross(tempDirection).y
      const dotProduct = tempForward.dot(tempDirection)

      let steerValue = Math.max(-1, Math.min(1, angleDiff * 3.0))
      if (dotProduct < 0) {
        steerValue = angleDiff >= 0 ? 1.0 : -1.0
      }

      if (avoidanceSteer !== 0) {
        steerValue = Math.max(-1, Math.min(1, steerValue + avoidanceSteer * 0.8))
      }

      // Acceleration / Braking
      const targetSpeedKmH = Math.min(maxSpeed, speedCap)
      let engineAccel = 0

      if (isRaceStarted) {
        if (speedKmH < targetSpeedKmH) {
          const ratio = Math.pow(speedKmH / targetSpeedKmH, 2)
          engineAccel = accel * speedMultiplier * (1 - ratio * 0.75)
        } else if (speedKmH > targetSpeedKmH + 6) {
          engineAccel = -accel * 0.7
        }
      }

      vehicleStateRef.current = {
        speed: currentSpeed,
        isBraking: engineAccel < 0,
        isNitro: false,
        steering: steerValue
      }

      const mass = bodyRef.current.mass()

      // Unstuck auto-recovery
      if (isRaceStarted && currentSpeed < 1.2) {
        stuckTimer.current += effectiveDelta
        if (stuckTimer.current > 2.5) {
          const targetWp = CIRCUIT_WAYPOINTS[currentWaypoint.current]
          const nextWpObj = CIRCUIT_WAYPOINTS[(currentWaypoint.current + 1) % CIRCUIT_WAYPOINTS.length]
          recoverDir.subVectors(nextWpObj.pos, targetWp.pos).normalize()
          const recoverPos = { x: targetWp.pos.x, y: 0.8, z: targetWp.pos.z }
          bodyRef.current.setTranslation(recoverPos, true)
          bodyRef.current.setLinvel({ x: recoverDir.x * 10, y: 0, z: recoverDir.z * 10 }, true)
          stuckTimer.current = 0
        }
      } else {
        stuckTimer.current = 0
      }

      // Apply steering torque
      const canSteer = currentSpeed > 0.4 || isRaceStarted
      if (canSteer) {
        const speedFactor = Math.max(0.65, 1 - (currentSpeed / 120))
        const panicMultiplier = Math.abs(angleDiff) > 0.35 ? 2.2 : 1.0
        torque.set(0, steerValue * turnSpeed * panicMultiplier * speedFactor * mass * 3.2, 0)
        bodyRef.current.applyTorqueImpulse(torque.multiplyScalar(effectiveDelta * 2), true)
      }

      // Apply forward / brake impulse
      force.copy(forwardVector).multiplyScalar(engineAccel * mass * effectiveDelta)
      const downforce = Math.min(currentSpeed * 30, mass * 1.5) * effectiveDelta
      force.y -= downforce
      bodyRef.current.applyImpulse(force, true)

      // Lateral grip impulse
      if (currentSpeed > 0.5) {
        aiDesiredVel.copy(forwardVector).multiplyScalar(currentSpeed)
        aiHorizontalVel.set(currentVelocity.x, 0, currentVelocity.z)

        aiVelocityDiff.subVectors(aiDesiredVel, aiHorizontalVel)
        const correctionImpulse = aiVelocityDiff.multiplyScalar(grip * effectiveDelta * mass)
        bodyRef.current.applyImpulse(correctionImpulse, true)
      }

      // Drag
      const dragRatio = Math.min(0.2, 0.0036 * currentSpeed * effectiveDelta * 3)
      dragImpulse.copy(currentVelocity).multiplyScalar(-dragRatio * mass)
      bodyRef.current.applyImpulse(dragImpulse, true)
    } catch {
      /* ignore stale handles during remount */
    }
  })

  useEffect(() => {
    if (bodyRef.current) {
      addAIRef(bodyRef)
      const body = bodyRef.current as any
      body.__racerName = name
      body.__racerColor = color
    }
  }, [addAIRef, name, color])

  return (
    <RigidBody
      ref={bodyRef}
      name={name}
      position={initialPosition}
      rotation={[0, -Math.PI / 2, 0]} // Face +X direction
      angularDamping={4}
      linearDamping={0.1}
      friction={0}
      restitution={0.1}
      enabledRotations={[false, true, false]}
    >
      <CuboidCollider args={[1, 0.4, 2]} density={1200 / 6.4} />
      <group>
        <EnhancedCarModel 
          color={color}
          isPlayer={false}
          vehicleStateRef={vehicleStateRef}
        />
      </group>
    </RigidBody>
  )
}
