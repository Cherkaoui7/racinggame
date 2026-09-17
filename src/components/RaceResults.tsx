import { useGameStore } from '../store/useGameStore'
import { formatRaceTime } from '../utils/time'
import { Trophy, Clock, Flag, Award, Gauge, Zap, Wind, Home, RotateCcw, BarChart2 } from 'lucide-react'

export function RaceResults() {
  const position = useGameStore(s => s.position)
  const finalPosition = useGameStore(s => s.finalPosition)
  const totalRacers = useGameStore(s => s.totalRacers)
  const bestLapTime = useGameStore(s => s.bestLapTime)
  const totalRaceTime = useGameStore(s => s.totalRaceTime)
  const racers = useGameStore(s => s.racers)
  const racerProgress = useGameStore(s => s.racerProgress)
  const topSpeed = useGameStore(s => s.topSpeed)
  const nitroUses = useGameStore(s => s.nitroUses)
  const longestDrift = useGameStore(s => s.longestDrift)
  const startGame = useGameStore(s => s.startGame)
  const goToMenu = useGameStore(s => s.goToMenu)
  const displayPos = finalPosition || position
  const isWinner = displayPos === 1
  const isPodium = displayPos <= 3

  return (
    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-[#050A16]/80 to-[#050A16]/95 flex justify-end items-center p-4 sm:p-8 z-50 font-sans pointer-events-auto overflow-hidden">
      
      {/* Left Area: Title and primary stats. Positioned to left, transparent background to see the car */}
      <div className="absolute left-8 top-12 flex flex-col items-start animate-fade-in-up max-w-xl">
        <div className="flex items-center gap-4 mb-2">
          {isWinner ? (
            <div className="relative">
              <Trophy size={64} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse" />
              <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl -z-10" />
            </div>
          ) : isPodium ? (
            <Award size={64} className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
          ) : (
            <Flag size={64} className="text-gray-400 drop-shadow-[0_0_15px_rgba(148,163,184,0.4)]" />
          )}
          <div className="flex flex-col">
            <h1 className={`text-5xl sm:text-7xl font-black italic text-transparent bg-clip-text tracking-tighter ${
              isWinner
                ? 'bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-600 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                : isPodium
                ? 'bg-gradient-to-br from-cyan-200 via-cyan-400 to-blue-600'
                : 'bg-gradient-to-br from-white via-gray-300 to-gray-500'
            }`}>
              {isWinner ? 'VICTORY!' : isPodium ? 'PODIUM!' : 'COMPLETED'}
            </h1>
            <p className="text-cyan-400 font-bold uppercase tracking-[0.3em] text-xs sm:text-sm mt-1">
              {isWinner ? 'CYBERPUNK CHAMPIONSHIP WINNER' : 'OFFICIAL FINAL CLASSIFICATION'}
            </p>
          </div>
        </div>

        {/* Primary Stats Panel */}
        <div className="flex gap-4 mt-8">
          <div className="flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <span className="text-cyan-500/80 font-bold tracking-widest uppercase text-[10px] mb-1">Final Position</span>
            <div className="text-4xl sm:text-5xl font-black italic">
              <span className={isWinner ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : isPodium ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-white'}>
                #{displayPos}
              </span>
              <span className="text-2xl sm:text-3xl text-gray-600"> / {totalRacers}</span>
            </div>
          </div>

          <div className="flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <span className="text-cyan-500/80 font-bold tracking-widest uppercase text-[10px] flex items-center gap-1.5 mb-1">
              Total Time
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white mt-1 tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {formatRaceTime(totalRaceTime)}
            </div>
          </div>

          <div className="flex flex-col bg-black/40 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_8px_32px_rgba(6,182,212,0.2)]">
            <span className="text-cyan-500/80 font-bold tracking-widest uppercase text-[10px] flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-cyan-400" />
              Best Lap
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] mt-1 tracking-tight">
              {formatRaceTime(bestLapTime)}
            </div>
            {isWinner && (
              <div className="mt-2 bg-yellow-500/20 text-yellow-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-center border border-yellow-500/30 w-fit">
                NEW RECORD
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Extended Leaderboard & Stats */}
      <div className="w-full max-w-3xl bg-[#050A16]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in-up h-full max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Flag className="text-cyan-400" size={28} />
            <h2 className="text-2xl font-black italic tracking-widest text-white">RACE RESULTS</h2>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-cyan-400 text-[10px] tracking-widest font-bold uppercase">Neon Circuit</div>
              <div className="text-gray-400 text-[9px] tracking-widest uppercase mt-0.5">3 Laps • 4.2 KM</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] tracking-widest font-bold text-blue-300">🌙 NIGHT</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-[30px_1fr_80px_80px_80px_80px_80px] gap-2 pb-2 border-b border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 px-3">
            <div>Pos</div>
            <div>Driver</div>
            <div className="text-center">Lap 1</div>
            <div className="text-center">Lap 2</div>
            <div className="text-center">Lap 3</div>
            <div className="text-center text-cyan-500">Best Lap</div>
            <div className="text-right">Status</div>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar flex flex-col gap-1.5">
            {racers.map((racer) => {
              const isRacerPlayer = racer.isPlayer
              const isP1 = racer.position === 1
              const prog = racerProgress[racer.name]
              const lapTimes = prog?.lapTimes || []
              
              let driverBest = null
              if (lapTimes.length > 0) {
                driverBest = Math.min(...lapTimes)
              }

              return (
                <div
                  key={racer.name}
                  className={`grid grid-cols-[30px_1fr_80px_80px_80px_80px_80px] gap-2 items-center px-3 py-2 rounded-xl transition-all ${
                    isRacerPlayer
                      ? 'bg-gradient-to-r from-cyan-950/40 to-cyan-900/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`font-black text-sm italic ${
                    isP1 ? 'text-yellow-400' : isRacerPlayer ? 'text-cyan-300' : 'text-white/60'
                  }`}>
                    {racer.position}
                  </div>
                  
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="w-1.5 h-3.5 rounded-sm"
                      style={{ backgroundColor: racer.color, boxShadow: `0 0 8px ${racer.color}` }}
                    />
                    <span className={`font-bold text-sm tracking-wide truncate ${
                      isRacerPlayer ? 'text-white' : 'text-gray-300'
                    }`}>
                      {racer.name}
                    </span>
                    {isRacerPlayer && (
                      <span className="text-[9px] font-black uppercase text-cyan-300 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-500/30 flex-shrink-0">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 text-center">{formatRaceTime(lapTimes[0] || null)}</div>
                  <div className="text-[11px] font-mono text-gray-400 text-center">{formatRaceTime(lapTimes[1] || null)}</div>
                  <div className="text-[11px] font-mono text-gray-400 text-center">{formatRaceTime(lapTimes[2] || null)}</div>
                  
                  <div className={`text-[11px] font-mono font-bold text-center ${isRacerPlayer ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-cyan-500/70'}`}>
                    {formatRaceTime(driverBest)}
                  </div>

                  <div className="text-right flex justify-end">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      isP1 && racer.isFinished
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                        : racer.isFinished
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/5 text-gray-500 border-white/10'
                    }`}>
                      {isP1 && racer.isFinished ? 'WINNER' : racer.isFinished ? 'FINISHED' : 'RUNNING'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Statistics Footer */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Gauge className="text-blue-400" size={20} />
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Top Speed</div>
              <div className="text-lg font-mono font-bold text-white">{Math.round(topSpeed)} <span className="text-xs text-gray-500">km/h</span></div>
            </div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Zap className="text-orange-400" size={20} />
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Nitro Used</div>
              <div className="text-lg font-mono font-bold text-white">{nitroUses} <span className="text-xs text-gray-500">times</span></div>
            </div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Wind className="text-cyan-400" size={20} />
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Longest Drift</div>
              <div className="text-lg font-mono font-bold text-white">{longestDrift.toFixed(1)} <span className="text-xs text-gray-500">s</span></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <button 
            onClick={goToMenu}
            className="group flex-1 flex justify-center items-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all border border-white/10 hover:border-white/30 cursor-pointer"
          >
            <Home size={16} />
            Main Menu
          </button>
          
          <button 
            onClick={startGame}
            className="group flex-[2] flex justify-center items-center gap-2 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-[13px] rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-500" />
            Play Again
          </button>

          <button 
            className="group flex-1 flex justify-center items-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all border border-white/10 hover:border-white/30 cursor-pointer"
          >
            <BarChart2 size={16} />
            View Replay
          </button>
        </div>

      </div>
    </div>
  )
}
