import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- ANTI-TAMPER SECURITY ---
if (import.meta.env.PROD) {
  // Disable right-click context menu (prevents easy Inspect Element)
  document.addEventListener('contextmenu', (e) => e.preventDefault())

  // Obfuscate / swallow console logs to prevent state leakage
  const noOp = () => {}
  window.console.log = noOp
  window.console.info = noOp
  window.console.warn = noOp
  // Leave error for fatal crash reports, or swallow it too
  window.console.error = noOp
}
// ----------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
