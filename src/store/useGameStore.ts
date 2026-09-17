import { create } from 'zustand'
import { detectHardware, type HardwareProfile, type GraphicsOption, type QualityPreset } from '../utils/hardwareDetection'

export interface RacerProgress {
  lap: number
  checkpoint: number
  finished: boolean
  finishTime: number
  lapStartTime: number
  lapTimes: number[]
}

export interface RacerInfo {
  name: string
  isPlayer: boolean
  color: string
  lap: number
  distance: number
  position: number
  isFinished?: boolean
}

export const CHECKPOINT_DISTANCES: Record<number, number> = {
  0: 0,
  1: 25,
  2: 150,
  3: 275,
  4: 400,
  5: 500,
}

export function getTrackDistance(x: number, z: number): number {
  const cx = Math.max(-65, Math.min(65, x))
  const cz = Math.max(-65, Math.min(65, z))

  const dN = Math.abs(cz - (-62.5))
  const dE = Math.abs(cx - 62.5)
  const dS = Math.abs(cz - 62.5)
  const dW = Math.abs(cx - (-62.5))

  const minD = Math.min(dN, dE, dS, dW)

  if (minD === dN) {
    if (cx >= -25) return cx + 25
    else return 525 + cx
  }
  if (minD === dE) return 150 + cz
  if (minD === dS) return 275 - cx
  return 400 - cz
}

interface GameState {
  gameState: 'menu' | 'garage' | 'playing'
  selectedCar: string
  speed: number
  gear: number | string
  lap: number
  maxLaps: number
  position: number
  finalPosition: number | null
  finishedOrder: string[]
  totalRacers: number
  racerProgress: Record<string, RacerProgress>
  isGameOver: boolean
  nitro: number
  playerRef: React.MutableRefObject<any> | null
  aiRefs: React.MutableRefObject<any>[]
  currentLapTime: number
  currentLapStartTime: number
  bestLapTime: number | null
  lapTimes: number[]
  totalRaceTime: number | null
  raceStartTime: number
  topSpeed: number
  nitroUses: number
  longestDrift: number
  cameraMode: 'chase' | 'hood' | 'cinematic'
  difficulty: 'easy' | 'medium' | 'hard'
  graphicsQuality: GraphicsOption
  effectiveQuality: QualityPreset
  dynamicDpr: number
  resolutionScale: number
  fps: number
  showDebug: boolean
  frameTime: number
  drawCalls: number
  triangles: number
  hardwareProfile: HardwareProfile
  isRaceStarted: boolean
  gameId: number
  racers: RacerInfo[]
  startGame: () => void
  openGarage: () => void
  closeGarage: () => void
  goToMenu: () => void
  selectCar: (carId: string) => void
  setSpeed: (speed: number) => void
  setGear: (gear: number | string) => void
  setNitro: (nitro: number) => void
  setLongestDrift: (timeSec: number) => void
  passRacerCheckpoint: (name: string, checkpointId: number) => void
  setPlayerRef: (ref: React.MutableRefObject<any>) => void
  addAIRef: (ref: React.MutableRefObject<any>) => void
  updateRaceStatus: (lap: number, position: number, checkpoint: number) => void
  updateLeaderboard: () => void
  cycleCamera: () => void
  setDifficulty: (d: 'easy' | 'medium' | 'hard') => void
  setGraphicsQuality: (q: GraphicsOption) => void
  cycleGraphicsQuality: () => void
  setEffectiveQuality: (q: QualityPreset) => void
  setDynamicDpr: (dpr: number) => void
  setResolutionScale: (scale: number) => void
  setShowDebug: (show: boolean) => void
  setPerfMetrics: (metrics: { frameTime: number; drawCalls: number; triangles: number }) => void
  setFps: (fps: number) => void
  setIsRaceStarted: (started: boolean) => void
}

const hwProfile = detectHardware()
const savedQuality = (typeof localStorage !== 'undefined' ? localStorage.getItem('neon_racer_graphics') : null) as GraphicsOption | null
const initialQuality: GraphicsOption = savedQuality && ['low', 'medium', 'high', 'auto'].includes(savedQuality) ? savedQuality : 'auto'
const initialEffective: QualityPreset = initialQuality === 'auto' ? hwProfile.detectedTier : initialQuality
const initialDpr = initialEffective === 'low' ? 0.8 : initialEffective === 'medium' ? 1.0 : 1.35

const DEFAULT_RACERS: RacerInfo[] = [
  { name: 'Cherkaoui', isPlayer: true, color: '#00f0ff', lap: 1, distance: 0, position: 1 },
  { name: 'Shadow', isPlayer: false, color: '#ef4444', lap: 1, distance: 0, position: 2 },
  { name: 'Neon', isPlayer: false, color: '#f59e0b', lap: 1, distance: 0, position: 3 },
  { name: 'Blaze', isPlayer: false, color: '#06b6d4', lap: 1, distance: 0, position: 4 },
  { name: 'Drift', isPlayer: false, color: '#a855f7', lap: 1, distance: 0, position: 5 },
  { name: 'Apex', isPlayer: false, color: '#22c55e', lap: 1, distance: 0, position: 6 },
  { name: 'Nova', isPlayer: false, color: '#ec4899', lap: 1, distance: 0, position: 7 },
  { name: 'Rex', isPlayer: false, color: '#eab308', lap: 1, distance: 0, position: 8 },
]

function computeLeaderboard(state: GameState): { racers: RacerInfo[], position: number, finishedOrder: string[], totalRacers: number } | null {
  if (!state.playerRef?.current) return null

  const maxLaps = state.maxLaps
  const finishedOrder = [...state.finishedOrder]

  interface CompetitorData {
    name: string
    isPlayer: boolean
    color: string
    lap: number
    distance: number
    isFinished: boolean
    finishTime: number
  }

  const competitors: CompetitorData[] = []

  const processRacer = (name: string, isPlayer: boolean, color: string, ref: any) => {
    const prog = state.racerProgress[name] || { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: state.raceStartTime, lapTimes: [] }
    
    let totalDist = 0
    if (prog.finished) {
      totalDist = maxLaps * 500
      if (!finishedOrder.includes(name)) finishedOrder.push(name)
    } else {
      let rawDist = 0
      if (ref?.current) {
        const pos = ref.current.translation()
        rawDist = getTrackDistance(pos.x, pos.z)
      }
      
      const cpDist = CHECKPOINT_DISTANCES[prog.checkpoint] || 0
      let localDist = rawDist - cpDist
      if (localDist < -250) localDist += 500
      if (localDist > 250) localDist -= 500
      
      const nextCpDist = CHECKPOINT_DISTANCES[prog.checkpoint + 1] || 500
      const maxLocal = nextCpDist - cpDist
      localDist = Math.max(-50, Math.min(localDist, maxLocal))
      
      totalDist = (prog.lap - 1) * 500 + cpDist + localDist
    }

    competitors.push({
      name,
      isPlayer,
      color,
      lap: Math.min(prog.lap, maxLaps),
      distance: totalDist,
      isFinished: prog.finished,
      finishTime: prog.finishTime
    })
  }

  // Player
  processRacer('Cherkaoui', true, '#00f0ff', state.playerRef)

  // AI
  state.aiRefs.forEach((ref, i) => {
    if (!ref?.current) return
    const body = ref.current as any
    const aiName = body.__racerName || `AI #${i + 1}`
    const aiColor = body.__racerColor || '#ef4444'
    processRacer(aiName, false, aiColor, ref)
  })

  // Sort: Finished racers by time, unfinished by distance descending
  competitors.sort((a, b) => {
    if (a.isFinished && b.isFinished) return a.finishTime - b.finishTime
    if (a.isFinished) return -1
    if (b.isFinished) return 1
    return b.distance - a.distance
  })

  let playerPos = 1
  const rankedRacers: RacerInfo[] = competitors.map((c, idx) => {
    const pos = idx + 1
    if (c.isPlayer) playerPos = pos
    return {
      name: c.name,
      isPlayer: c.isPlayer,
      color: c.color,
      lap: c.lap,
      distance: c.distance,
      position: pos,
      isFinished: c.isFinished,
    }
  })

  return {
    racers: rankedRacers,
    position: playerPos,
    finishedOrder,
    totalRacers: competitors.length,
  }
}

export const useGameStore = create<GameState>((set) => ({
  gameState: 'menu',
  selectedCar: 'neon',
  speed: 0,
  gear: 1,
  lap: 1,
  maxLaps: 3,
  position: 1,
  finalPosition: null,
  finishedOrder: [],
  totalRacers: 8,
  racerProgress: {
    'Cherkaoui': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
    'Shadow': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
    'Neon': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
    'Blaze': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
    'Drift': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
    'Apex': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
    'Nova': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
    'Rex': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: 0, lapTimes: [] },
  },
  isGameOver: false,
  nitro: 100,
  playerRef: null,
  aiRefs: [],
  currentLapTime: 0,
  currentLapStartTime: 0,
  bestLapTime: null,
  lapTimes: [],
  totalRaceTime: null,
  raceStartTime: 0,
  topSpeed: 0,
  nitroUses: 0,
  longestDrift: 0,
  cameraMode: 'chase',
  difficulty: 'medium',
  graphicsQuality: initialQuality,
  effectiveQuality: initialEffective,
  dynamicDpr: initialDpr,
  resolutionScale: 1.0,
  fps: 60,
  showDebug: false,
  frameTime: 16.6,
  drawCalls: 0,
  triangles: 0,
  hardwareProfile: hwProfile,
  isRaceStarted: false,
  gameId: 0,
  racers: DEFAULT_RACERS,
  startGame: () =>
    set((state) => ({
      gameState: 'playing',
      isGameOver: false,
      isRaceStarted: false,
      gameId: state.gameId + 1,
      lap: 1,
      nitro: 100,
      gear: 1,
      speed: 0,
      position: 1,
      finalPosition: null,
      finishedOrder: [],
      racerProgress: {
        'Cherkaoui': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
        'Shadow': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
        'Neon': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
        'Blaze': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
        'Drift': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
        'Apex': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
        'Nova': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
        'Rex': { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: Date.now(), lapTimes: [] },
      },
      racers: DEFAULT_RACERS.map((r, i) => ({ ...r, lap: 1, distance: -i * 6, position: i + 1 })),
      aiRefs: [],
      raceStartTime: Date.now(),
      currentLapStartTime: Date.now(),
      currentLapTime: 0,
      lapTimes: [],
      totalRaceTime: null,
      bestLapTime: null,
      topSpeed: 0,
      nitroUses: 0,
      longestDrift: 0,
    })),
  openGarage: () => set({ gameState: 'garage' }),
  closeGarage: () => set({ gameState: 'menu' }),
  goToMenu: () => set({ gameState: 'menu', isGameOver: false, isRaceStarted: false, speed: 0, currentLapTime: 0, currentLapStartTime: 0, finalPosition: null, finishedOrder: [], lapTimes: [], totalRaceTime: null, bestLapTime: null, topSpeed: 0, nitroUses: 0, longestDrift: 0 }),
  setIsRaceStarted: (started) => set({ isRaceStarted: started, raceStartTime: started ? Date.now() : 0, currentLapStartTime: started ? Date.now() : 0 }),
  selectCar: (carId) => set({ selectedCar: carId }),
  setPlayerRef: (ref) => set({ playerRef: ref }),
  addAIRef: (ref) =>
    set((state) => {
      if (state.aiRefs.includes(ref)) return state
      return { aiRefs: [...state.aiRefs, ref] }
    }),
  updateLeaderboard: () =>
    set((state) => {
      const computed = computeLeaderboard(state)
      if (!computed) return state
      // Skip re-render if positions haven't actually changed
      const oldRacers = state.racers
      const newRacers = computed.racers
      // Also check finishedOrder changes so AI finishes are properly tracked
      if (oldRacers.length === newRacers.length && computed.position === state.position
          && computed.finishedOrder.length === state.finishedOrder.length) {
        let same = true
        for (let i = 0; i < oldRacers.length; i++) {
          if (oldRacers[i].name !== newRacers[i].name || oldRacers[i].lap !== newRacers[i].lap) {
            same = false
            break
          }
        }
        if (same) return state
      }
      return computed
    }),
  setSpeed: (speed) =>
    set((state) => ({ 
      speed,
      topSpeed: Math.max(state.topSpeed, speed)
    })),
  setGear: (gear) => set({ gear }),
  setNitro: (nitro) =>
    set((s) => {
      const clamped = Math.max(0, Math.min(100, nitro))
      // If nitro decreases (is being used) and was previously near max, or just count usage cycles
      let newNitroUses = s.nitroUses
      if (s.nitro > clamped && s.nitro === 100) {
        newNitroUses += 1
      }
      return Math.round(s.nitro) === Math.round(clamped) 
        ? s 
        : { nitro: clamped, nitroUses: Math.max(s.nitroUses, newNitroUses) }
    }),
  setLongestDrift: (timeSec) =>
    set((s) => ({ longestDrift: Math.max(s.longestDrift, timeSec) })),
  updateRaceStatus: (lap, position) =>
    set({ lap, position }),
  passRacerCheckpoint: (name, cp) =>
    set((state) => {
      const prog = state.racerProgress[name] || { lap: 1, checkpoint: 0, finished: false, finishTime: 0, lapStartTime: state.raceStartTime, lapTimes: [] }
      if (prog.finished) return state

      const newProg = { ...prog }
      let newBestLapTime = state.bestLapTime
      let newCurrentLapStartTime = state.currentLapStartTime
      let newLapTimes = [...state.lapTimes]
      let newTotalRaceTime = state.totalRaceTime

      if (cp === 5) {
        if (prog.checkpoint === 4) {
          newProg.lap += 1
          newProg.checkpoint = 0
          
          const now = Date.now()
          const lapStart = newProg.lapStartTime || state.raceStartTime
          const lapTime = now - lapStart
          
          if (!newProg.lapTimes) newProg.lapTimes = []
          newProg.lapTimes.push(lapTime)
          newProg.lapStartTime = now

          if (name === 'Cherkaoui') {
            newLapTimes.push(lapTime)
            newCurrentLapStartTime = now
            newBestLapTime = Math.min(...newLapTimes)
          }

          if (newProg.lap > state.maxLaps) {
            newProg.finished = true
            newProg.finishTime = Date.now()
            
            if (name === 'Cherkaoui') {
              newTotalRaceTime = newLapTimes.reduce((acc, curr) => acc + curr, 0)
            }
          }
        }
      } else if (cp === prog.checkpoint + 1) {
        newProg.checkpoint = cp
      } else {
        return state
      }

      const newRacerProgress = { ...state.racerProgress, [name]: newProg }
      
      let isGameOver = state.isGameOver
      if (name === 'Cherkaoui' && newProg.finished) {
        isGameOver = true
      }

      // Update the global state.lap based on player's lap to keep HUD sync
      let globalLap = state.lap
      if (name === 'Cherkaoui') {
        globalLap = newProg.finished ? state.maxLaps : newProg.lap
      }

      return { 
        racerProgress: newRacerProgress, 
        isGameOver, 
        lap: globalLap,
        bestLapTime: newBestLapTime,
        currentLapStartTime: newCurrentLapStartTime,
        lapTimes: newLapTimes,
        totalRaceTime: newTotalRaceTime
      }
    }),
  cycleCamera: () => set((state) => {
    const modes: ('chase' | 'hood' | 'cinematic')[] = ['chase', 'hood', 'cinematic']
    const nextIndex = (modes.indexOf(state.cameraMode) + 1) % modes.length
    return { cameraMode: modes[nextIndex] }
  }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setGraphicsQuality: (graphicsQuality) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('neon_racer_graphics', graphicsQuality)
    }
    set((state) => {
      const effective: QualityPreset = graphicsQuality === 'auto' ? state.hardwareProfile.detectedTier : graphicsQuality
      const dpr = effective === 'low' ? 0.8 : effective === 'medium' ? 1.0 : 1.35
      return {
        graphicsQuality,
        effectiveQuality: effective,
        dynamicDpr: dpr,
      }
    })
  },
  cycleGraphicsQuality: () => set((state) => {
    const qualities: GraphicsOption[] = ['auto', 'low', 'medium', 'high']
    const nextIndex = (qualities.indexOf(state.graphicsQuality) + 1) % qualities.length
    const nextQuality = qualities[nextIndex]
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('neon_racer_graphics', nextQuality)
    }
    const effective: QualityPreset = nextQuality === 'auto' ? state.hardwareProfile.detectedTier : nextQuality
    const dpr = effective === 'low' ? 0.8 : effective === 'medium' ? 1.0 : 1.35
    return { 
      graphicsQuality: nextQuality,
      effectiveQuality: effective,
      dynamicDpr: dpr,
    }
  }),
  setEffectiveQuality: (effectiveQuality) => set({ effectiveQuality }),
  setDynamicDpr: (dynamicDpr) => set({ dynamicDpr }),
  setResolutionScale: (scale) => set({ resolutionScale: scale }),
  setShowDebug: (show) => set({ showDebug: show }),
  setPerfMetrics: (metrics) => set({ frameTime: metrics.frameTime, drawCalls: metrics.drawCalls, triangles: metrics.triangles }),
  setFps: (fps) => set((s) => (s.fps === fps ? s : { fps })),
}))

if (typeof window !== 'undefined') {
  (window as any).useGameStore = useGameStore
}
