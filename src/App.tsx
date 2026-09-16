import { Game } from './game/Game'
import { Menu } from './components/Menu'
import { Garage } from './components/Garage'
import { useGameStore } from './store/useGameStore'

function App() {
  const gameState = useGameStore(state => state.gameState)
  const gameId = useGameStore(state => state.gameId)

  return (
    <div className="w-screen h-screen">
      {gameState === 'playing' && <Game key={gameId} />}
      {gameState === 'menu' && <Menu />}
      {gameState === 'garage' && <Garage />}
    </div>
  )
}

export default App
