import { create } from 'zustand'
import { detectHardware, type HardwareProfile, type GraphicsOption, type QualityPreset } from '../utils/hardwareDetection'

export interface RacerInfo {
  name: string
  isPlayer: boolean
  color: string
  lap: number
  distance: number
  position: number
  isFinished?: boolean
}

export function getTrackDistance(x: number, z: number): number {
  // Centerlines: North (z = -62.5), East (x = 62.5), South (z = 62.5), West (x = -62.5)
  // Start/Finish line is at x = -25, z = -62.5. Total circuit length = 500m.
  const cx = Math.max(-65, Math.min(65, x))
  const cz = Math.max(-65, Math.min(65, z))

  const dN = Math.abs(cz - (-62.5))
  const dE = Math.abs(cx - 62.5)
  const dS = Math.abs(cz - 62.5)
  const dW = Math.abs(cx - (-62.5))

  const minD = Math.min(dN, dE, dS, dW)

  if (minD === dN) {
    // North Straight (Traffic moving East +X towards Turn 1)
    if (cx >= -25) {
      return cx + 25 // Post-start line: 0m to 87.5m
    } else {
      return 525 + cx // Starting grid / approach: 460m to 500m
    }
  }

  if (minD === dE) {
    // East Straight (Traffic moving South +Z towards Turn 2)
    return 150 + cz // 87.5m to 212.5m
  }

  if (minD === dS) {
    // South Straight (Traffic moving West -X towards Turn 3)
    return 275 - cx // 212.5m to 337.5m
  }

  // West Straight (Traffic moving North -Z towards Turn 4)
  return 400 - cz // 337.5m to 462.5m
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
  targetCheckpoint: number
  totalCheckpoints: number
  isGameOver: boolean
  nitro: number
  playerRef: React.MutableRefObject<any> | null
  aiRefs: React.MutableRefObject<any>[]
  currentLapTime: number
  bestLapTime: number | null
  raceStartTime: number
  cameraMode: 'chase' | 'hood' | 'cinematic'
  difficulty: 'easy' | 'medium' | 'hard'
  graphicsQuality: GraphicsOption
  effectiveQuality: QualityPreset
  dynamicDpr: number
  fps: number
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
  passCheckpoint: (checkpointId: number) => void
  completeLap: () => void
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

function computeLeaderboard(state: GameState, isPlayerFinishing = false): { racers: RacerInfo[], position: number, finishedOrder: string[], totalRacers: number } | null {
  if (!state.playerRef?.current) return null

  const maxLaps = state.maxLaps
  const isPlayerDone = isPlayerFinishing || state.isGameOver || state.lap > maxLaps
  const finishedOrder = [...state.finishedOrder]

  // IMPORTANT: Scan AI cars for finish FIRST, before adding the player.
  // This ensures AI cars that finished before the player get earlier indices in finishedOrder.
  interface CompetitorData {
    name: string
    isPlayer: boolean
    color: string
    lap: number
    distance: number
    isFinished: boolean
  }

  const aiCompetitors: CompetitorData[] = []

  for (let i = 0; i < state.aiRefs.length; i++) {
    const ref = state.aiRefs[i]
    if (!ref?.current) continue
    const body = ref.current as any
    const pos = body.translation()
    const aiName = body.__racerName || `AI #${i + 1}`
    const aiColor = body.__racerColor || '#ef4444'
    const aiLap = body.__lap || 1
    const aiIsFinished = aiLap > maxLaps

    // Register AI finish BEFORE registering player finish
    if (aiIsFinished && !finishedOrder.includes(aiName)) {
      finishedOrder.push(aiName)
    }

    const aiTrackDist = getTrackDistance(pos.x, pos.z)
    let aiEffectiveDist = aiTrackDist
    if (aiLap === 1 && aiTrackDist > 350) {
      aiEffectiveDist = aiTrackDist - 500
    }
    const aiTotalDist = aiIsFinished
      ? maxLaps * 500
      : (aiLap - 1) * 500 + aiEffectiveDist

    aiCompetitors.push({
      name: aiName,
      isPlayer: false,
      color: aiColor,
      lap: Math.min(aiLap, maxLaps),
      distance: aiTotalDist,
      isFinished: aiIsFinished,
    })
  }

  // NOW add the player to finishedOrder (after all AI finishers are already registered)
  if (isPlayerDone && !finishedOrder.includes('Cherkaoui')) {
    finishedOrder.push('Cherkaoui')
  }

  // Calculate Player Distance
  const pPos = state.playerRef.current.translation()
  const pTrackDist = getTrackDistance(pPos.x, pPos.z)

  let pEffectiveDist = pTrackDist
  if (!isPlayerDone && state.lap === 1 && pTrackDist > 350) {
    pEffectiveDist = pTrackDist - 500
  }
  const pTotalDist = isPlayerDone
    ? maxLaps * 500
    : (state.lap - 1) * 500 + pEffectiveDist

  const competitors: CompetitorData[] = [
    {
      name: 'Cherkaoui',
      isPlayer: true,
      color: '#00f0ff',
      lap: isPlayerDone ? maxLaps : Math.min(state.lap, maxLaps),
      distance: pTotalDist,
      isFinished: isPlayerDone,
    },
    ...aiCompetitors,
  ]

  // Sort: Finished racers in order of finish, then unfinished racers by distance descending
  competitors.sort((a, b) => {
    const aFinIndex = finishedOrder.indexOf(a.name)
    const bFinIndex = finishedOrder.indexOf(b.name)

    if (aFinIndex !== -1 && bFinIndex !== -1) {
      return aFinIndex - bFinIndex
    }
    if (aFinIndex !== -1) return -1
    if (bFinIndex !== -1) return 1

    return b.distance - a.distance
  })

  let playerPos = 1
  const rankedRacers: RacerInfo[] = competitors.map((c, idx) => {
    const pos = idx + 1
    if (c.isPlayer) {
      playerPos = pos
    }
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
    totalRacers: rankedRacers.length,
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
  targetCheckpoint: 1,
  totalCheckpoints: 4,
  isGameOver: false,
  nitro: 100,
  playerRef: null,
  aiRefs: [],
  currentLapTime: 0,
  bestLapTime: null,
  raceStartTime: 0,
  cameraMode: 'chase',
  difficulty: 'medium',
  graphicsQuality: initialQuality,
  effectiveQuality: initialEffective,
  dynamicDpr: initialDpr,
  fps: 60,
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
      targetCheckpoint: 1,
      nitro: 100,
      gear: 1,
      speed: 0,
      position: 1,
      finalPosition: null,
      finishedOrder: [],
      racers: DEFAULT_RACERS.map((r, i) => ({ ...r, lap: 1, distance: -i * 6, position: i + 1 })),
      aiRefs: [],
      raceStartTime: Date.now(),
      currentLapTime: 0,
    })),
  openGarage: () => set({ gameState: 'garage' }),
  closeGarage: () => set({ gameState: 'menu' }),
  goToMenu: () => set({ gameState: 'menu', isGameOver: false, isRaceStarted: false, speed: 0, currentLapTime: 0, finalPosition: null, finishedOrder: [] }),
  setIsRaceStarted: (started) => set({ isRaceStarted: started, raceStartTime: started ? Date.now() : 0 }),
  selectCar: (carId) => set({ selectedCar: carId }),
  setPlayerRef: (ref) => set({ playerRef: ref }),
  addAIRef: (ref) =>
    set((state) => {
      if (state.aiRefs.includes(ref)) return state
      return { aiRefs: [...state.aiRefs, ref] }
    }),
  updateLeaderboard: () =>
    set((state) => {
      const computed = computeLeaderboard(state, false)
      if (!computed) return state
      // Skip re-render if positions haven't actually changed
      const oldRacers = state.racers
      const newRacers = computed.racers
      // Also check finishedOrder changes so AI finishes are properly tracked
      if (oldRacers.length === newRacers.length && computed.position === state.position
          && computed.finishedOrder.length === state.finishedOrder.length) {
        let same = true
        for (let i = 0; i < oldRacers.length; i++) {
          if (oldRacers[i].position !== newRacers[i].position || oldRacers[i].lap !== newRacers[i].lap) {
            same = false
            break
          }
        }
        if (same) return state
      }
      return computed
    }),
  setSpeed: (speed) =>
    set((s) => (Math.round(s.speed) === Math.round(speed) ? s : { speed })),
  setGear: (gear) => set((s) => (s.gear === gear ? s : { gear })),
  setNitro: (nitro) =>
    set((s) => {
      const clamped = Math.max(0, Math.min(100, nitro))
      return Math.round(s.nitro) === Math.round(clamped) ? s : { nitro: clamped }
    }),
  updateRaceStatus: (lap, position, checkpoint) =>
    set({ lap, position, targetCheckpoint: checkpoint }),
  passCheckpoint: (checkpointId) =>
    set((state) => {
      if (checkpointId === state.targetCheckpoint) {
        if (checkpointId === state.totalCheckpoints) {
          // Last checkpoint passed -> next step is crossing the Start/Finish line (checkpoint 0)
          return { targetCheckpoint: 0 }
        }
        return { targetCheckpoint: checkpointId + 1 }
      }
      return state
    }),
  completeLap: () =>
    set((state) => {
      if (state.targetCheckpoint === 0) {
        const now = Date.now()
        const lapDuration = (now - state.raceStartTime) / 1000
        const newBest =
          state.bestLapTime === null
            ? lapDuration
            : Math.min(state.bestLapTime, lapDuration)

        if (state.lap >= state.maxLaps) {
          const computed = computeLeaderboard(state, true)
          const finalPos = computed ? computed.position : state.position
          return {
            isGameOver: true,
            targetCheckpoint: 1,
            bestLapTime: newBest,
            position: finalPos,
            finalPosition: finalPos,
            finishedOrder: computed ? computed.finishedOrder : state.finishedOrder,
            racers: computed ? computed.racers : state.racers,
          }
        }
        return {
          lap: state.lap + 1,
          targetCheckpoint: 1,
          raceStartTime: now,
          bestLapTime: newBest,
        }
      }
      return state
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
  setFps: (fps) => set((s) => (s.fps === fps ? s : { fps })),
}))

if (typeof window !== 'undefined') {
  (window as any).useGameStore = useGameStore
}
