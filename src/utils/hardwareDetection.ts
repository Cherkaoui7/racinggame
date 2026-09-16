export type QualityPreset = 'low' | 'medium' | 'high'
export type GraphicsOption = QualityPreset | 'auto'

export interface HardwareProfile {
  detectedTier: QualityPreset
  renderer: string
  vendor: string
  deviceMemoryGB: number
  logicalCores: number
  isMobile: boolean
  description: string
}

let cachedProfile: HardwareProfile | null = null

export function detectHardware(): HardwareProfile {
  if (cachedProfile) {
    return cachedProfile
  }

  const isBrowser = typeof window !== 'undefined'
  if (!isBrowser) {
    cachedProfile = {
      detectedTier: 'medium',
      renderer: 'Server / Headless',
      vendor: 'Unknown',
      deviceMemoryGB: 8,
      logicalCores: 8,
      isMobile: false,
      description: 'Default server profile',
    }
    return cachedProfile
  }

  let renderer = 'Generic WebGL Renderer'
  let vendor = 'Unknown'

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' }) || canvas.getContext('webgl', { powerPreference: 'high-performance' })
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer
      } else {
        vendor = gl.getParameter(gl.VENDOR) || vendor
        renderer = gl.getParameter(gl.RENDERER) || renderer
      }
      // Release WebGL context resources
      const loseContext = gl.getExtension('WEBGL_lose_context')
      if (loseContext) {
        loseContext.loseContext()
      }
    }
  } catch {
    // Fallback if canvas/webgl creation fails
  }

  const nav = navigator as Navigator & { deviceMemory?: number }
  const deviceMemoryGB = nav.deviceMemory || 8
  const logicalCores = nav.hardwareConcurrency || 4
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)

  // Clean up long ANGLE string for clean UI display
  // e.g. "ANGLE (Intel, Intel(R) UHD Graphics (0x00009BC4) Direct3D11 vs_5_0 ps_5_0, D3D11)" -> "Intel(R) UHD Graphics"
  let cleanRenderer = renderer
  if (cleanRenderer.startsWith('ANGLE (')) {
    const parts = cleanRenderer.slice(7).split(',')
    if (parts.length >= 2) {
      cleanRenderer = parts[1].trim()
    }
  }
  cleanRenderer = cleanRenderer
    .replace(/\s*(?:Direct3D\d*|vs_\d+_\d+|ps_\d+_\d+|OpenGL|Vulkan|Metal).*/i, '')
    .replace(/\s*\([0-9a-fA-FxX]+\)/g, '')
    .trim()

  // Tier classification logic
  const rLower = renderer.toLowerCase()
  let tier: QualityPreset = 'medium'
  let description = 'Balanced settings recommended'

  const isLowGpu = 
    rLower.includes('intel') ||
    rLower.includes('uhd') ||
    rLower.includes('hd graphics') ||
    rLower.includes('iris') ||
    rLower.includes('swiftshader') ||
    rLower.includes('llvmpipe') ||
    rLower.includes('basic render') ||
    rLower.includes('mali-4') ||
    rLower.includes('mali-t') ||
    rLower.includes('mali-g3') ||
    rLower.includes('mali-g5') ||
    rLower.includes('adreno (tm) 3') ||
    rLower.includes('adreno (tm) 4') ||
    rLower.includes('adreno (tm) 5') ||
    rLower.includes('adreno (tm) 61') ||
    deviceMemoryGB <= 4 ||
    logicalCores <= 2

  const isHighGpu = 
    (rLower.includes('rtx') ||
     rLower.includes('gtx 1080') ||
     rLower.includes('gtx 1070') ||
     rLower.includes('gtx 1660 ti') ||
     rLower.includes('titan') ||
     rLower.includes('rx 6') ||
     rLower.includes('rx 7') ||
     rLower.includes('rx 5700') ||
     rLower.includes('m1 pro') ||
     rLower.includes('m1 max') ||
     rLower.includes('m1 ultra') ||
     rLower.includes('m2 pro') ||
     rLower.includes('m2 max') ||
     rLower.includes('m2 ultra') ||
     rLower.includes('m3 pro') ||
     rLower.includes('m3 max') ||
     rLower.includes('m4') ||
     rLower.includes('geforce rtx')) &&
    deviceMemoryGB >= 8 &&
    logicalCores >= 6

  if (isLowGpu) {
    tier = 'low'
    description = 'Power-saving & high compatibility (60 FPS)'
  } else if (isHighGpu) {
    tier = 'high'
    description = 'Full neon effects & high resolution'
  } else {
    tier = 'medium'
    description = 'Standard balanced performance (60 FPS)'
  }

  cachedProfile = {
    detectedTier: tier,
    renderer: cleanRenderer,
    vendor,
    deviceMemoryGB,
    logicalCores,
    isMobile,
    description,
  }

  return cachedProfile
}
