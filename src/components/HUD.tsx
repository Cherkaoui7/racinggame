import { useCallback, memo } from 'react'
import { useGameStore } from '../store/useGameStore'
import { Speedometer } from './Speedometer'
import { Countdown } from './Countdown'
import { RaceResults } from './RaceResults'
import { RaceTimer } from './RaceTimer'
import { Minimap } from './MinimapTracker'
import { Camera, Zap, Monitor, Activity } from 'lucide-react'

// 1. Lap Counter
const LapBox = memo(function LapBox() {
  const lap = useGameStore(s => s.lap)
  const maxLaps = useGameStore(s => s.maxLaps)

  return (
    <div className="relative">
      <div className="relative bg-[#030914] border-2 border-cyan-400 px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] min-w-[190px]">
        <div className="flex flex-col">
          <span className="text-white/90 font-bold italic text-xs uppercase tracking-widest mb-0.5">
            LAP
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white text-5xl font-black italic leading-none tracking-tight">
              {String(lap).padStart(2, '0')}
            </span>
            <span className="text-cyan-400 text-3xl font-black italic">
              /
            </span>
            <span className="text-cyan-300 text-3xl font-black italic">
              {String(maxLaps).padStart(2, '0')}
            </span>
          </div>
          <div className="relative w-full h-1 bg-cyan-950/60 rounded-full mt-2.5 flex items-center">
            <div className="h-full bg-cyan-400 rounded-full w-1/3 shadow-[0_0_8px_#00f0ff]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-cyan-400 shadow-[0_0_8px_#00f0ff] -ml-1" />
          </div>
        </div>
      </div>
    </div>
  )
})

// 2. Camera Pill
const CameraPill = memo(function CameraPill() {
  const cameraMode = useGameStore(s => s.cameraMode)
  return (
    <div className="bg-[#030914] border border-cyan-400 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5">
      <Camera size={13} className="text-cyan-400" />
      <span className="text-white/80 text-[11px] font-bold tracking-wider uppercase">
        CAM <span className="text-white/60">[C]</span>
      </span>
      <span className="text-cyan-400 font-bold italic text-[11px] capitalize ml-0.5">
        {cameraMode}
      </span>
    </div>
  )
})

// 3. GFX Quality Pill
const GfxPill = memo(function GfxPill() {
  const graphicsQuality = useGameStore(s => s.graphicsQuality)
  const effectiveQuality = useGameStore(s => s.effectiveQuality)
  const cycleGraphicsQuality = useGameStore(s => s.cycleGraphicsQuality)

  return (
    <button
      onClick={cycleGraphicsQuality}
      className="pointer-events-auto bg-[#030914] border border-purple-400 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.3)] flex items-center gap-1.5 hover:bg-purple-950/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      title="Click to toggle Graphics Quality: Auto, Low, Medium, High"
    >
      <Monitor size={13} className="text-purple-400" />
      <span className="text-white/80 text-[11px] font-bold tracking-wider uppercase">
        GFX
      </span>
      <span className={`font-black italic text-[11px] uppercase px-1.5 py-0.5 rounded ${
        graphicsQuality === 'auto'
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
          : graphicsQuality === 'low' 
          ? 'bg-amber-500/20 text-amber-300' 
          : graphicsQuality === 'medium'
          ? 'bg-sky-500/20 text-sky-300'
          : 'bg-purple-500/20 text-purple-300'
      }`}>
        {graphicsQuality === 'auto' ? `AUTO • ${effectiveQuality}` : graphicsQuality}
      </span>
    </button>
  )
})

// 4. Live FPS & Dynamic Resolution Telemetry
const LiveTelemetry = memo(function LiveTelemetry() {
  const fps = useGameStore(s => s.fps)
  const dynamicDpr = useGameStore(s => s.dynamicDpr)

  return (
    <div className="bg-[#030914] border border-white/10 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-1.5">
      <Activity 
        size={13} 
        className={fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'} 
      />
      <span className={`font-mono font-bold text-[11px] ${
        fps >= 50 ? 'text-emerald-300' : fps >= 30 ? 'text-amber-300' : 'text-rose-300'
      }`}>
        {fps} FPS
      </span>
      <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-500/20">
        {Math.round(dynamicDpr * 100)}% Res
      </span>
    </div>
  )
})

// 5. Dynamic Leaderboard
const Leaderboard = memo(function Leaderboard() {
  const racers = useGameStore(s => s.racers)

  return (
    <div className="mt-2 flex flex-col gap-1 w-52 bg-[#030914] p-2 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(0,0,0,0.6)]">
      {racers.map((racer) => {
        const isFirst = racer.position === 1
        const isPlayer = racer.isPlayer
        return (
          <div 
            key={racer.name} 
            className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all duration-300 ${
              isPlayer 
                ? 'bg-cyan-500/25 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                : isFirst 
                ? 'bg-amber-500/15 border border-amber-400/30' 
                : 'bg-transparent'
            }`}
          >
            <span className={`font-black text-xs w-3.5 ${isPlayer ? 'text-cyan-300 font-extrabold' : isFirst ? 'text-amber-300' : 'text-white/60'}`}>
              {racer.position}
            </span>
            <div 
              className="w-1 h-3.5 rounded-full" 
              style={{ backgroundColor: racer.color, boxShadow: `0 0 6px ${racer.color}` }}
            />
            <span className={`font-bold italic text-xs tracking-wide flex-1 truncate ${
              isPlayer ? 'text-cyan-200 font-extrabold' : isFirst ? 'text-amber-200' : 'text-white/90'
            }`}>
              {racer.name}
            </span>
            {isPlayer && (
              <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-500/30">
                YOU
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
})

// 6. Race Position Box
const PositionBox = memo(function PositionBox() {
  const position = useGameStore(s => s.position)
  const totalRacers = useGameStore(s => s.totalRacers)

  return (
    <div className="relative">
      <div className="relative bg-[#030914] border-2 border-cyan-400 px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] min-w-[190px]">
        <div className="flex flex-col items-end">
          <span className="text-white/90 font-bold italic text-xs uppercase tracking-widest mb-0.5">
            POSITION
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#fbbf24] text-5xl font-black italic leading-none tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
              {String(position).padStart(2, '0')}
            </span>
            <span className="text-cyan-400 text-3xl font-black italic">
              /
            </span>
            <span className="text-white/90 text-3xl font-black italic">
              {String(totalRacers).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

// 7. Nitro Meter
const NitroMeter = memo(function NitroMeter() {
  const nitro = useGameStore(s => s.nitro)

  return (
    <div className="relative">
      <div className="relative bg-[#030914] border-2 border-cyan-400 px-4 py-2 rounded-full flex items-center gap-2.5 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
        <div className="flex items-center justify-center">
          <Zap size={18} className="text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_#00f0ff]" />
        </div>
        <div className="text-cyan-400 font-black italic tracking-widest text-xs">
          NITRO
        </div>
        <div className="flex items-center gap-1.5 px-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const isFilled = i < Math.ceil((nitro / 100) * 6)
            return (
              <div 
                key={i} 
                className={`w-6 h-3 -skew-x-12 rounded-[2px] transition-all duration-75 ${
                  isFilled 
                    ? 'bg-cyan-400 border border-cyan-300 shadow-[0_0_10px_#00f0ff]' 
                    : 'bg-cyan-950/40 border border-cyan-900/50'
                }`}
              />
            )
          })}
        </div>
        <div className="text-white font-black italic text-xs tracking-wider ml-1">
          {Math.round(nitro)}%
        </div>
      </div>
    </div>
  )
})

export function HUD() {
  const isGameOver = useGameStore(s => s.isGameOver)
  const gameId = useGameStore(s => s.gameId)
  const setIsRaceStarted = useGameStore(s => s.setIsRaceStarted)

  const handleCountdownComplete = useCallback(() => {
    setIsRaceStarted(true)
  }, [setIsRaceStarted])

  if (isGameOver) {
    return <RaceResults />
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none font-sans select-none z-30 overflow-hidden">
      
      {/* 3-2-1-GO Countdown */}
      <Countdown key={gameId} onComplete={handleCountdownComplete} />

      {/* TOP LEFT: Lap Counter & Leaderboard */}
      <div className="absolute top-7 left-8 flex flex-col items-start gap-2.5">
        <LapBox />

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <CameraPill />
          <GfxPill />
          <LiveTelemetry />
        </div>
        
        {/* Dynamic Leaderboard */}
        <Leaderboard />
      </div>

      {/* TOP RIGHT: Position & Time */}
      <div className="absolute top-7 right-8 flex flex-col items-end gap-2.5">
        <PositionBox />
        <RaceTimer />
      </div>

      {/* BOTTOM RIGHT: Speedometer */}
      <div className="absolute bottom-6 right-6">
        <Speedometer />
      </div>

      {/* BOTTOM LEFT: Minimap Radar & Nitro Meter */}
      <div className="absolute bottom-6 left-8 flex flex-col items-start gap-4">
        <Minimap />
        <NitroMeter />
      </div>
      
    </div>
  )
}

