import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'
import { Activity, Cpu, Box, LayoutGrid, MonitorPlay, Zap } from 'lucide-react'

export function PerformancePanel() {
  const showDebug = useGameStore(s => s.showDebug)
  const setShowDebug = useGameStore(s => s.setShowDebug)
  const fps = useGameStore(s => s.fps)
  const frameTime = useGameStore(s => s.frameTime)
  const drawCalls = useGameStore(s => s.drawCalls)
  const triangles = useGameStore(s => s.triangles)
  const graphicsQuality = useGameStore(s => s.graphicsQuality)
  const effectiveQuality = useGameStore(s => s.effectiveQuality)
  const resolutionScale = useGameStore(s => s.resolutionScale)
  const totalRacers = useGameStore(s => s.totalRacers)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === '`' || e.key === '~') {
        setShowDebug(!useGameStore.getState().showDebug)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!showDebug) return null

  const getFpsColor = () => {
    if (fps >= 55) return 'text-green-400'
    if (fps >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getFrameTimeColor = () => {
    if (frameTime <= 17) return 'text-green-400'
    if (frameTime <= 25) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDrawCallColor = () => {
    if (drawCalls < 100) return 'text-green-400'
    if (drawCalls < 200) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="absolute top-4 right-4 bg-black/80 border border-white/20 p-4 rounded-xl shadow-2xl backdrop-blur-md z-[100] text-xs font-mono text-white/90 min-w-[220px]">
      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
        <Activity className="w-4 h-4 text-cyan-400" />
        <span className="font-bold text-sm text-cyan-400 tracking-wider">PERFORMANCE</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 opacity-70"><Zap className="w-3 h-3" /> FPS</div>
          <span className={`font-bold ${getFpsColor()} text-sm`}>{fps}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 opacity-70"><Cpu className="w-3 h-3" /> Frame Time</div>
          <span className={`font-bold ${getFrameTimeColor()}`}>{frameTime.toFixed(1)} ms</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 opacity-70"><Box className="w-3 h-3" /> Draw Calls</div>
          <span className={`font-bold ${getDrawCallColor()}`}>{drawCalls}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 opacity-70"><LayoutGrid className="w-3 h-3" /> Triangles</div>
          <span className="font-bold">{(triangles / 1000).toFixed(1)}k</span>
        </div>

        <div className="h-px bg-white/10 my-1" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 opacity-70"><MonitorPlay className="w-3 h-3" /> Res Scale</div>
          <span className="font-bold text-cyan-300">{resolutionScale.toFixed(2)}x</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="opacity-70">Preset / Eff</span>
          <span className="font-bold text-cyan-300 uppercase">{graphicsQuality} / {effectiveQuality}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="opacity-70">Active Cars</span>
          <span className="font-bold text-cyan-300">{totalRacers}</span>
        </div>
      </div>
    </div>
  )
}
