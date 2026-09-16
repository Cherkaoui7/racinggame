import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

const AI_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#06b6d4',
  '#a855f7',
  '#22c55e',
  '#ec4899',
  '#eab308'
]

function getAngleFromQuat(q: { x: number, y: number, z: number, w: number }): number {
  const v = { x: 0, y: 0, z: -1 }
  const ix =  q.w * v.x + q.y * v.z - q.z * v.y
  const iy =  q.w * v.y + q.z * v.x - q.x * v.z
  const iz =  q.w * v.z + q.x * v.y - q.y * v.x
  const iw = -q.x * v.x - q.y * v.y - q.z * v.z
  const fx = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y
  const fz = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x
  return Math.atan2(fz, fx) * (180 / Math.PI)
}

export function Minimap() {
  const playerGroupRef = useRef<SVGGElement>(null)
  const aiGroupRefs = useRef<(SVGGElement | null)[]>([])
  const { playerRef, aiRefs } = useGameStore()

  useEffect(() => {
    let animId: number
    const update = () => {
      try {
        // 1. Update Player Arrow
        if (playerRef?.current && playerGroupRef.current) {
          const pos = playerRef.current.translation()
          const rot = playerRef.current.rotation()
          
          // Circuit scale mapping: 3D world [-62.5, 62.5] -> Minimap canvas [32, 128]
          const mapX = 80 + (pos.x / 62.5) * 48
          const mapY = 80 + (pos.z / 62.5) * 48

          // Exact forward angle in degrees (0 deg = East / Right, 90 deg = South / Down)
          const angleDeg = getAngleFromQuat(rot)

          playerGroupRef.current.setAttribute('transform', `translate(${mapX.toFixed(2)}, ${mapY.toFixed(2)}) rotate(${angleDeg.toFixed(1)})`)
        }

        // 2. Update AI Competitor Dots
        if (aiRefs && aiRefs.length > 0) {
          aiRefs.forEach((ref, idx) => {
            const group = aiGroupRefs.current[idx]
            if (ref?.current && group) {
              const aiPos = ref.current.translation()
              const aiMapX = 80 + (aiPos.x / 62.5) * 48
              const aiMapY = 80 + (aiPos.z / 62.5) * 48
              group.setAttribute('transform', `translate(${aiMapX.toFixed(2)}, ${aiMapY.toFixed(2)})`)
            }
          })
        }
      } catch {
        /* ignore transient refs during remount */
      }
      animId = requestAnimationFrame(update)
    }

    animId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animId)
  }, [playerRef, aiRefs])

  return (
    <div className="relative w-44 h-44 rounded-full border-2 border-cyan-400 bg-[#040814] shadow-[0_0_25px_rgba(6,182,212,0.6)] overflow-hidden select-none pointer-events-none">
      {/* Circuit Track Outline SVG */}
      <svg viewBox="0 0 160 160" className="w-full h-full">
        {/* Outer circuit path matching the 3D track layout */}
        <rect
          x="32"
          y="32"
          width="96"
          height="96"
          rx="18"
          ry="18"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center glowing racing line */}
        <rect
          x="32"
          y="32"
          width="96"
          height="96"
          rx="18"
          ry="18"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />

        {/* Checkpoint indicators along the track */}
        {/* CP 1: North Straight (x = 80, y = 32) */}
        <circle cx="80" cy="32" r="2.5" fill="#06b6d4" />
        {/* CP 2: East Straight (x = 128, y = 80) */}
        <circle cx="128" cy="80" r="2.5" fill="#a855f7" />
        {/* CP 3: South Straight (x = 80, y = 128) */}
        <circle cx="80" cy="128" r="2.5" fill="#ec4899" />
        {/* CP 4: West Straight (x = 32, y = 80) */}
        <circle cx="32" cy="80" r="2.5" fill="#22c55e" />

        {/* Checkered Start/Finish Flag on North Straight (x = 55, y = 24) */}
        <g transform="translate(52, 23)">
          <rect x="0" y="0" width="2" height="2" fill="#ffffff" />
          <rect x="2" y="0" width="2" height="2" fill="#000000" />
          <rect x="4" y="0" width="2" height="2" fill="#ffffff" />
          <rect x="0" y="2" width="2" height="2" fill="#000000" />
          <rect x="2" y="2" width="2" height="2" fill="#ffffff" />
          <rect x="4" y="2" width="2" height="2" fill="#000000" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#ffffff" strokeWidth="1" />
        </g>

        {/* AI Competitor Dots (Native SVG circles inside translated groups) */}
        {AI_COLORS.map((color, idx) => (
          <g
            key={idx}
            ref={(el) => { aiGroupRefs.current[idx] = el }}
            transform="translate(80, 32)"
          >
            <circle r="3.5" fill={color} stroke="#030712" strokeWidth="0.8" />
          </g>
        ))}

        {/* Dynamic Player Triangle Arrow (Native SVG polygon inside translated & rotated group) */}
        <g 
          ref={playerGroupRef}
          transform="translate(80, 32) rotate(0)"
        >
          {/* Arrow pointing East (0 deg) */}
          <polygon
            points="7,0 -5,-4.5 -2,0 -5,4.5"
            fill="#00f0ff"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
        </g>
      </svg>
    </div>
  )
}
