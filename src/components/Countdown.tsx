import { useEffect, useState, useRef } from 'react'
import { soundEngine } from '../audio/SoundEngine'

export function Countdown({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState<number | string>(3)
  const [isVisible, setIsVisible] = useState(true)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let current = 3
    soundEngine.playCountdownBeep(false)

    const interval = setInterval(() => {
      current -= 1
      if (current > 0) {
        setCount(current)
        soundEngine.playCountdownBeep(false)
      } else if (current === 0) {
        setCount('GO!')
        soundEngine.playCountdownBeep(true)
        onCompleteRef.current()
      } else {
        setIsVisible(false)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, []) // Empty deps: runs exactly once per mount and cannot be cancelled or reset by HUD re-renders

  if (!isVisible) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div 
        key={count} 
        className={`font-black italic drop-shadow-[0_0_40px_rgba(6,182,212,1)] animate-ping-once ${
          count === 'GO!' 
            ? 'text-8xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 via-cyan-400 to-cyan-500 drop-shadow-[0_0_60px_rgba(16,185,129,1)] scale-110' 
            : 'text-8xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600'
        }`}
        style={{ animation: 'ping-once 0.9s cubic-bezier(0, 0, 0.2, 1) forwards' }}
      >
        {count}
      </div>
    </div>
  )
}

