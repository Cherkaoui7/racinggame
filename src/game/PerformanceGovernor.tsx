import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

const SAMPLE_COUNT = 60

/**
 * PerformanceGovernor regulates Dynamic Resolution Scaling (DRS) and
 * adaptive visual tiers in real-time when graphicsQuality === 'auto'.
 * 
 * It runs inside the React Three Fiber Canvas with zero per-frame heap allocations.
 */
export function PerformanceGovernor() {
  const frameTimes = useRef(new Float32Array(SAMPLE_COUNT))
  const frameIndex = useRef(0)
  const samplesRecorded = useRef(0)
  const sumFrameTimes = useRef(0)

  const lastFpsUpdate = useRef(0)
  const lastPerfMetricsUpdate = useRef(0)
  const lastGovernorCheck = useRef(0)
  const lastLeaderboardUpdate = useRef(0)
  
  // DRS State
  const currentResolutionScale = useRef(1.0)
  const drsLastChange = useRef(0)

  useFrame((state, delta) => {
    (window as any).__threeGl = state.gl
    // Discard abnormal frame spikes (e.g. browser tab switching / minimizing)
    const clampedDelta = Math.min(0.2, Math.max(0.001, delta))

    // Update circular moving average buffer
    const idx = frameIndex.current
    if (samplesRecorded.current >= SAMPLE_COUNT) {
      sumFrameTimes.current -= frameTimes.current[idx]
    } else {
      samplesRecorded.current++
    }

    frameTimes.current[idx] = clampedDelta
    sumFrameTimes.current += clampedDelta
    frameIndex.current = (idx + 1) % SAMPLE_COUNT

    const avgDelta = sumFrameTimes.current / Math.max(1, samplesRecorded.current)
    const currentFps = Math.min(120, Math.max(10, Math.round(1 / Math.max(0.001, avgDelta))))

    // Throttled HUD FPS update (every 250ms) to prevent excessive React state churn
    if (state.clock.elapsedTime - lastFpsUpdate.current > 0.25) {
      lastFpsUpdate.current = state.clock.elapsedTime
      useGameStore.getState().setFps(currentFps)
    }

    // Throttled live race leaderboard & rankings update (every 500ms — positions don't change faster)
    if (state.clock.elapsedTime - lastLeaderboardUpdate.current > 0.5) {
      lastLeaderboardUpdate.current = state.clock.elapsedTime
      useGameStore.getState().updateLeaderboard()
    }

    // Update Debug Performance metrics (throttled to 250ms)
    if (state.clock.elapsedTime - lastPerfMetricsUpdate.current > 0.25) {
      lastPerfMetricsUpdate.current = state.clock.elapsedTime
      if (useGameStore.getState().showDebug) {
        useGameStore.getState().setPerfMetrics({
          frameTime: avgDelta * 1000,
          drawCalls: state.gl.info.render.calls,
          triangles: state.gl.info.render.triangles
        })
      }
    }

    const { graphicsQuality, effectiveQuality, setEffectiveQuality, setResolutionScale, setDynamicDpr } = useGameStore.getState()

    // Dynamic Resolution Scaling (DRS)
    if (graphicsQuality === 'auto' || graphicsQuality === 'high' || graphicsQuality === 'medium') {
      // Allow DRS adjustments every 1 second
      if (state.clock.elapsedTime - drsLastChange.current > 1.0 && samplesRecorded.current >= 60) {
        let targetScale = currentResolutionScale.current

        let minScale = 0.7
        if (effectiveQuality === 'high') minScale = 0.85
        else if (effectiveQuality === 'medium') minScale = 0.8

        if (currentFps < 40) {
          // Drop resolution if struggling
          targetScale = Math.max(minScale, currentResolutionScale.current - 0.05)
        } else if (currentFps > 52) {
          // Recover resolution if doing well
          targetScale = Math.min(1.0, currentResolutionScale.current + 0.02)
        }

        if (targetScale !== currentResolutionScale.current) {
          currentResolutionScale.current = targetScale
          drsLastChange.current = state.clock.elapsedTime
          
          // Apply new scale to DPR based on native pixel ratio capped at 1.5
          const maxPixelRatio = 1.5
          const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, maxPixelRatio) : 1

          setDynamicDpr(pixelRatio * targetScale)
          setResolutionScale(targetScale)
        }
      }
    }

    // Governor tier step-down (Auto quality only)
    if (graphicsQuality === 'auto' && state.clock.elapsedTime - lastGovernorCheck.current > 5.0 && samplesRecorded.current >= 60) {
      lastGovernorCheck.current = state.clock.elapsedTime

      // If we are at max DRS drop and STILL struggling, downgrade tier
      if (currentFps < 35 && currentResolutionScale.current <= 0.7) {
        if (effectiveQuality === 'high') {
          setEffectiveQuality('medium')
          currentResolutionScale.current = 1.0 // Reset scale for new tier
          const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1
          setDynamicDpr(pixelRatio * 1.0)
          setResolutionScale(1.0)
        } else if (effectiveQuality === 'medium') {
          setEffectiveQuality('low')
          currentResolutionScale.current = 1.0
          const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1
          setDynamicDpr(pixelRatio * 1.0)
          setResolutionScale(1.0)
        }
      }
    }
  })

  return null
}
