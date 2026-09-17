import { useGameStore } from '../store/useGameStore'
import { Trophy, Play } from 'lucide-react'

export function Menu() {
  const startGame = useGameStore(s => s.startGame)
  const openGarage = useGameStore(s => s.openGarage)
  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const graphicsQuality = useGameStore(s => s.graphicsQuality)
  const effectiveQuality = useGameStore(s => s.effectiveQuality)
  const hardwareProfile = useGameStore(s => s.hardwareProfile)
  const setGraphicsQuality = useGameStore(s => s.setGraphicsQuality)

  return (
    <div className="absolute inset-0 bg-neutral-950 text-white font-sans flex flex-col overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 relative z-10 animate-fade-in-up py-4">
        
        <div className="text-center relative">
          <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-cyan-400 to-purple-600 opacity-20 -z-10"></div>
          <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-cyan-400 to-purple-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] leading-none">
            NEON
            <br />
            RACER
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent flex-1"></div>
            <p className="text-sm md:text-base text-cyan-200 tracking-[0.3em] uppercase font-bold text-shadow-sm">Web Racing MVP</p>
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent flex-1"></div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          
          <div className="flex flex-col space-y-3 w-72">
            <button 
              onClick={startGame}
              className="group relative flex items-center justify-center space-x-3 bg-cyan-500 text-black py-4 px-6 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              <Play size={22} className="fill-current" />
              <span className="text-base font-black">Race Now</span>
            </button>
            
            <button 
              onClick={openGarage}
              className="flex items-center justify-center space-x-3 bg-white/5 text-white py-3 px-6 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 cursor-pointer"
            >
              <Trophy size={18} className="text-yellow-400" />
              <span className="text-sm">Garage</span>
            </button>
          </div>

          {/* Selectors Row: AI Difficulty & Graphics Quality */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* Difficulty Selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">AI Difficulty</span>
              <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md">
                {['easy', 'medium', 'hard'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl as any)}
                    className={`px-4 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-all text-xs cursor-pointer ${
                      difficulty === lvl 
                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Graphics Quality Selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Graphics Quality</span>
              <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md">
                {(['auto', 'low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setGraphicsQuality(q)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-all text-xs cursor-pointer ${
                      graphicsQuality === q 
                        ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hardware Profile & Active Preset Info Banner */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-gray-400 font-mono text-[11px]">
              GPU: <span className="text-cyan-300 font-bold">{hardwareProfile.renderer}</span>
            </span>
            <span className="text-white/30">•</span>
            <span className="text-purple-300 font-bold uppercase tracking-wider text-[11px]">
              {graphicsQuality === 'auto' ? `Auto → ${effectiveQuality} (60 FPS DRS)` : `${graphicsQuality} Preset`}
            </span>
          </div>

        </div>
      </div>
      
      <div className="relative z-10 p-6 text-center flex justify-between items-center text-gray-500 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex gap-8 text-xs tracking-widest uppercase font-bold">
          <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-1 rounded text-white/80">ZQSD</kbd> Steer</span>
          <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-1 rounded text-white/80">SPACE</kbd> Brake</span>
          <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-1 rounded text-white/80">SHIFT</kbd> Nitro</span>
          <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-1 rounded text-white/80">C</kbd> Camera</span>
          <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-1 rounded text-white/80">R</kbd> Respawn</span>
        </div>
        <div className="text-xs font-mono text-cyan-500/50">v1.0.0</div>
      </div>
    </div>
  )
}
