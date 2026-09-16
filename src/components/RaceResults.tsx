import { useGameStore } from '../store/useGameStore'
import { Trophy, Clock, Flag, ChevronRight, Award } from 'lucide-react'

export function RaceResults() {
  const { position, finalPosition, totalRacers, bestLapTime, racers, startGame, goToMenu } = useGameStore()
  const displayPos = finalPosition || position
  const isWinner = displayPos === 1
  const isPodium = displayPos <= 3

  return (
    <div className="absolute inset-0 bg-[#020612]/94 flex flex-col items-center overflow-y-auto p-3 sm:p-6 backdrop-blur-2xl z-50 font-sans pointer-events-auto">
      
      <div className="flex flex-col items-center animate-fade-in-up w-full max-w-lg m-auto py-2">
        {isWinner ? (
          <div className="relative">
            <Trophy size={48} className="text-yellow-400 mb-1 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce" />
            <div className="absolute -inset-3 bg-yellow-500/20 rounded-full blur-xl -z-10" />
          </div>
        ) : isPodium ? (
          <Award size={48} className="text-cyan-400 mb-1 drop-shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
        ) : (
          <Flag size={48} className="text-gray-400 mb-1 drop-shadow-[0_0_15px_rgba(148,163,184,0.4)]" />
        )}

        <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black italic text-transparent bg-clip-text tracking-tight ${
          isWinner
            ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]'
            : isPodium
            ? 'bg-gradient-to-r from-cyan-300 via-sky-400 to-cyan-500'
            : 'bg-gradient-to-r from-white via-gray-300 to-gray-500'
        }`}>
          {isWinner ? 'VICTORY!' : isPodium ? 'PODIUM FINISH!' : 'RACE COMPLETED'}
        </h1>
        
        <p className="text-cyan-400/80 font-bold uppercase tracking-widest text-[10px] sm:text-[11px] mt-0.5">
          {isWinner ? 'CYBERPUNK CHAMPIONSHIP WINNER' : 'OFFICIAL FINAL CLASSIFICATION'}
        </p>

        {/* Primary Stats Panel */}
        <div className="w-full bg-[#070e20]/85 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 mt-3 sm:mt-4 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-2 gap-3">
            
            <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3">
              <span className="text-gray-400 font-bold tracking-widest uppercase text-[10px]">Final Position</span>
              <div className="text-3xl sm:text-4xl font-black italic mt-0.5">
                <span className={isWinner ? 'text-yellow-400 drop-shadow-[0_0_10px_#fbbf24]' : isPodium ? 'text-cyan-400 drop-shadow-[0_0_10px_#00f0ff]' : 'text-white'}>
                  #{displayPos}
                </span>
                <span className="text-lg sm:text-xl text-gray-500"> / {totalRacers}</span>
              </div>
            </div>

            <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3">
              <span className="text-gray-400 font-bold tracking-widest uppercase text-[10px] flex items-center gap-1.5">
                <Clock size={12} className="text-emerald-400" />
                Best Lap
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] mt-1">
                {bestLapTime ? bestLapTime.toFixed(2) + 's' : '--'}
              </div>
            </div>

          </div>

          {/* Full Final Classification Table */}
          <div className="mt-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/50 px-2">
              <span>Pos • Driver</span>
              <span>Laps • Status</span>
            </div>

            <div className="flex flex-col gap-1 mt-1.5 max-h-36 sm:max-h-44 overflow-y-auto pr-1">
              {racers.map((racer) => {
                const isRacerPlayer = racer.isPlayer
                const isP1 = racer.position === 1
                return (
                  <div
                    key={racer.name}
                    className={`flex items-center justify-between px-2.5 py-1 rounded-lg transition-all ${
                      isRacerPlayer
                        ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : isP1
                        ? 'bg-amber-500/15 border border-amber-400/30'
                        : 'bg-white/[0.03] border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-xs w-4 ${
                        isP1 ? 'text-amber-400' : isRacerPlayer ? 'text-cyan-300' : 'text-white/60'
                      }`}>
                        #{racer.position}
                      </span>
                      <div
                        className="w-1.5 h-3 rounded-full"
                        style={{ backgroundColor: racer.color, boxShadow: `0 0 6px ${racer.color}` }}
                      />
                      <span className={`font-bold italic text-xs tracking-wide ${
                        isRacerPlayer ? 'text-cyan-200 font-extrabold' : isP1 ? 'text-amber-200' : 'text-white/90'
                      }`}>
                        {racer.name}
                      </span>
                      {isRacerPlayer && (
                        <span className="text-[8px] font-black uppercase text-cyan-400 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-500/40">
                          YOU
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-white/50">
                        {racer.lap}/3
                      </span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isP1
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
                          : racer.isFinished
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {isP1 ? 'WINNER' : racer.isFinished ? 'FINISHED' : 'RUNNING'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 w-full justify-center">
          <button 
            onClick={goToMenu}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/90 font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all border border-white/10 hover:border-white/30 cursor-pointer"
          >
            Main Menu
          </button>
          <button 
            onClick={startGame}
            className="group px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-[11px] rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer"
          >
            Play Again
            <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  )
}
