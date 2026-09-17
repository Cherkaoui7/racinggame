import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

export function PerformanceMonitor() {
  const { gl, scene } = useThree()

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    
    const updateStats = () => {
      frameCount++
      const now = performance.now()
      
      if (now - lastTime >= 1000) {
        let lights = 0
        let objects = 0
        scene.traverse((obj) => {
          objects++
          if ((obj as THREE.Light).isLight) lights++
        })

        const fpsEl = document.getElementById('perf-fps')
        if (fpsEl) fpsEl.innerText = `FPS: ${frameCount}`
        
        const frameEl = document.getElementById('perf-frame')
        if (frameEl) frameEl.innerText = `Frame: ${Math.round((1000 / frameCount) * 10) / 10}ms`
        
        const drawEl = document.getElementById('perf-draw')
        if (drawEl) drawEl.innerText = `Draws: ${gl.info.render.calls}`
        
        const trisEl = document.getElementById('perf-tris')
        if (trisEl) trisEl.innerText = `Tris: ${(gl.info.render.triangles / 1000).toFixed(1)}k`
        
        const lightsEl = document.getElementById('perf-lights')
        if (lightsEl) lightsEl.innerText = `Lights: ${lights}`
        
        const objsEl = document.getElementById('perf-objs')
        if (objsEl) objsEl.innerText = `Objs: ${objects}`

        frameCount = 0
        lastTime = now
      }
      
      requestAnimationFrame(updateStats)
    }
    
    const raf = requestAnimationFrame(updateStats)
    return () => cancelAnimationFrame(raf)
  }, [gl, scene])

  return null
}

export function PerformanceOverlay() {
  return (
    <div id="perf-overlay" style={{
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: '#00ff00',
      fontFamily: 'monospace',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      pointerEvents: 'none',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }}>
      <strong>PERFORMANCE</strong>
      <hr style={{ borderColor: '#333', margin: '4px 0' }}/>
      <div id="perf-fps">FPS: 0</div>
      <div id="perf-frame">Frame: 0ms</div>
      <div id="perf-draw">Draws: 0</div>
      <div id="perf-tris">Tris: 0k</div>
      <div id="perf-lights">Lights: 0</div>
      <div id="perf-objs">Objs: 0</div>
    </div>
  )
}
