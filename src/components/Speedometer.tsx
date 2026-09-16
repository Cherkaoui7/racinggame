import { useGameStore } from '../store/useGameStore'

export function Speedometer() {
  const speed = useGameStore(s => s.speed)
  const gear = useGameStore(s => s.gear)
  
  // Speed mapping (0 to 240 KM/H)
  const maxSpeed = 240
  const speedRatio = Math.min(1, Math.max(0, speed / maxSpeed))

  // Arc configuration: from -135deg (bottom-left) to +135deg (bottom-right) = 270 deg
  const r = 74
  const cx = 95
  const cy = 95
  const circumference = 2 * Math.PI * r
  const arcFraction = 270 / 360
  const totalArcLength = circumference * arcFraction

  // Labels matching the reference image layout around the arc
  const dialLabels = [
    { text: '0', angleDeg: -135 },
    { text: '40', angleDeg: -100 },
    { text: '80', angleDeg: -65 },
    { text: '80', angleDeg: -30 }, // matches reference image dial
    { text: '120', angleDeg: 0 },
    { text: '160', angleDeg: 40 },
    { text: '200', angleDeg: 80 },
    { text: '240', angleDeg: 125 }
  ]

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Circular Gauge Frame */}
      <div className="relative w-[190px] h-[190px] flex items-center justify-center">
        {/* Subtle dark backdrop */}
        <div className="absolute inset-0 rounded-full bg-[#030914] border border-cyan-500/20 shadow-[0_0_25px_rgba(0,0,0,0.9)]" />

        {/* SVG Dial Arc */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-[225deg]" 
          viewBox="0 0 190 190"
        >
          <defs>
            <linearGradient id="speedGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="65%" stopColor="#06b6d4" />
              <stop offset="85%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${totalArcLength} ${circumference}`}
            strokeDashoffset="0"
          />

          {/* Active Speed Colored Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#speedGaugeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${totalArcLength * Math.max(0.02, speedRatio)} ${circumference}`}
            strokeDashoffset="0"
            style={{ filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.6))' }}
          />
        </svg>

        {/* Numeric Labels around Arc */}
        <div className="absolute inset-0 pointer-events-none">
          {dialLabels.map((lbl, i) => {
            // angleDeg: 0 is top (12 o'clock), -90 is left, 90 is right
            const rad = ((lbl.angleDeg - 90) * Math.PI) / 180
            const labelRadius = 57
            const x = cx + labelRadius * Math.cos(rad)
            const y = cy + labelRadius * Math.sin(rad)

            return (
              <span
                key={i}
                className="absolute text-white/80 font-bold text-[11px] tracking-tight transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                {lbl.text}
              </span>
            )
          })}
        </div>

        {/* Center Content: Inner Gear Hub + Digital Speed */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 pointer-events-none">
          {/* Inner Cyan Gear Circle */}
          <div className="w-14 h-14 rounded-full border-2 border-cyan-400 bg-[#030c1e]/70 flex flex-col items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)]">
            <span className="text-cyan-400 text-[9px] font-extrabold uppercase tracking-widest leading-none">
              GEAR
            </span>
            <span className="text-cyan-300 text-xl font-black leading-none mt-0.5">
              {gear === 0 ? 'N' : gear}
            </span>
          </div>

          {/* Big Digital Speed & Unit */}
          <div className="flex flex-col items-center mt-1">
            <span className="text-white text-4xl font-extrabold italic leading-none tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {Math.round(speed)}
            </span>
            <span className="text-cyan-400 font-bold text-[10px] tracking-widest uppercase mt-0.5">
              KM/H
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Indicator Pills: (ABS) (TCS) (ESP) (Engine) */}
      <div className="flex items-center gap-2 mt-2">
        <div className="px-2 py-0.5 rounded-full border border-white/20 bg-black/40 text-[9px] font-bold text-white/40 tracking-wider">
          ABS
        </div>
        <div className="px-2 py-0.5 rounded-full border border-white/20 bg-black/40 text-[9px] font-bold text-white/40 tracking-wider">
          TCS
        </div>
        <div className="px-2 py-0.5 rounded-full border border-white/20 bg-black/40 text-[9px] font-bold text-white/40 tracking-wider">
          ESP
        </div>
        <div className="px-2 py-0.5 rounded-full border border-white/20 bg-black/40 flex items-center justify-center text-white/40">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="7" width="14" height="10" rx="1" />
            <line x1="2" y1="10" x2="5" y2="10" />
            <line x1="2" y1="14" x2="5" y2="14" />
            <line x1="19" y1="10" x2="22" y2="10" />
            <line x1="19" y1="14" x2="22" y2="14" />
            <line x1="9" y1="4" x2="9" y2="7" />
            <line x1="15" y1="4" x2="15" y2="7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
