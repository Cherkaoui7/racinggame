import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { Timer } from 'lucide-react'

export function RaceTimer() {
  const timeRef = useRef<HTMLSpanElement>(null)
  const bestLapTime = useGameStore(state => state.bestLapTime)

  useEffect(() => {
    let animationFrameId: number

    const updateTime = () => {
      const state = useGameStore.getState()
      if (timeRef.current) {
        if (!state.isRaceStarted) {
          timeRef.current.textContent = '00:00.000'
        } else {
          const elapsed = (Date.now() - state.raceStartTime) / 1000
          
          const mins = Math.floor(elapsed / 60)
          const secs = Math.floor(elapsed % 60)
          const ms = Math.floor((elapsed % 1) * 1000)
          
          timeRef.current.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
        }
      }
      animationFrameId = requestAnimationFrame(updateTime)
    }

    updateTime()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const formatBestTime = (timeInSecs: number | null) => {
    if (timeInSecs === null) return '--:--.---'
    const mins = Math.floor(timeInSecs / 60)
    const secs = Math.floor(timeInSecs % 60)
    const ms = Math.floor((timeInSecs % 1) * 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  return (
    <div className="relative mt-1">
      {/* Outer Cyan Glow */}
      <div className="absolute inset-0 bg-cyan-500/10 blur-sm rounded-lg"></div>
      
      {/* Card matching reference: chamfered/rounded with glowing cyan border */}
      <div className="relative bg-[#030914] border border-cyan-400/70 px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] min-w-[210px] flex flex-col gap-1.5">
        
        {/* Top Row: [Icon] TIME       00:00.000 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Timer size={14} className="text-cyan-400" />
            <span className="text-cyan-400 font-bold italic text-xs tracking-widest uppercase">
              TIME
            </span>
          </div>
          <span 
            ref={timeRef} 
            className="text-white text-lg font-black font-mono tracking-tight"
          >
            00:00.000
          </span>
        </div>

        {/* Bottom Row: BEST       --:--.--- */}
        <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20">
          <span className="text-cyan-400/80 font-bold italic text-xs tracking-widest uppercase">
            BEST
          </span>
          <span className="text-white/40 text-xs font-mono font-bold tracking-wider">
            {formatBestTime(bestLapTime)}
          </span>
        </div>

      </div>
    </div>
  )
}
