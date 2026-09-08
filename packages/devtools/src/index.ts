import type { SpatialAssetDefinition } from '@astro-spatial/assets'
import type { SceneManifest } from '@astro-spatial/core'

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

export interface SpatialDiagnostic {
  readonly severity: DiagnosticSeverity
  readonly code: string
  readonly message: string
  readonly subject?: string
}

export interface DiagnosticBudgets {
  readonly maxAssets?: number
  readonly maxTriangleBudget?: number
  readonly maxTextureBudgetBytes?: number
}

export function analyzeScene(manifest: SceneManifest): SpatialDiagnostic[] {
  const diagnostics: SpatialDiagnostic[] = []
  const nodes = manifest.nodes
  const flattened = nodes.flatMap(function visit(node): SceneManifest['nodes'] {
    return [node, ...(node.children?.flatMap(visit) ?? [])]
  })
  if (!flattened.some((node) => node.kind === 'camera')) {
    diagnostics.push({ severity: 'warning', code: 'SCENE_NO_CAMERA', message: 'Scene has no camera node; the runtime default will be used.' })
  }
  if (!flattened.some((node) => node.kind === 'model' || node.kind === 'procedural-model')) {
    diagnostics.push({ severity: 'warning', code: 'SCENE_NO_MODEL', message: 'Scene has no model node.' })
  }
  return diagnostics
}

export function analyzeAssets(
  assets: readonly SpatialAssetDefinition[],
  budgets: DiagnosticBudgets = {},
): SpatialDiagnostic[] {
  const diagnostics: SpatialDiagnostic[] = []
  const triangleTotal = assets.reduce((total, asset) => total + (asset.triangleBudget ?? 0), 0)
  const textureTotal = assets.reduce((total, asset) => total + (asset.textureBudgetBytes ?? 0), 0)
  if (budgets.maxAssets !== undefined && assets.length > budgets.maxAssets) {
    diagnostics.push({ severity: 'warning', code: 'ASSET_COUNT_HIGH', message: `Asset count ${assets.length} exceeds budget ${budgets.maxAssets}.` })
  }
  if (budgets.maxTriangleBudget !== undefined && triangleTotal > budgets.maxTriangleBudget) {
    diagnostics.push({ severity: 'warning', code: 'TRIANGLE_BUDGET_HIGH', message: `Triangle budget ${triangleTotal} exceeds ${budgets.maxTriangleBudget}.` })
  }
  if (budgets.maxTextureBudgetBytes !== undefined && textureTotal > budgets.maxTextureBudgetBytes) {
    diagnostics.push({ severity: 'warning', code: 'TEXTURE_BUDGET_HIGH', message: `Texture budget ${textureTotal} exceeds ${budgets.maxTextureBudgetBytes}.` })
  }
  assets.forEach((asset) => {
    if (!asset.provenance) diagnostics.push({ severity: 'info', code: 'ASSET_PROVENANCE_MISSING', message: 'Record where this asset came from for agent-safe editing.', subject: asset.id })
  })
  return diagnostics
}

export function formatDiagnostics(diagnostics: readonly SpatialDiagnostic[]): string {
  return diagnostics.length === 0
    ? 'No spatial diagnostics.'
    : diagnostics.map((diagnostic) => {
      const subject = diagnostic.subject ? ` [${diagnostic.subject}]` : ''
      return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}${subject}: ${diagnostic.message}`
    }).join('\n')
}

export interface RuntimeStats {
  readonly quality: string
  readonly dpr: number
  readonly drawCalls: number
  readonly triangles: number
}

export function mountRuntimeOverlay(
  host: HTMLElement,
  readStats: () => RuntimeStats,
): () => void {
  const overlay = document.createElement('aside')
  overlay.setAttribute('data-astro-spatial-devtools', 'runtime-overlay')
  overlay.style.cssText = 'position:absolute;right:12px;top:12px;z-index:4;padding:8px 10px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(8,11,18,.82);color:#dfe6f5;font:11px/1.4 ui-monospace,SFMono-Regular,monospace;pointer-events:none;backdrop-filter:blur(10px);'
  host.appendChild(overlay)
  let animationFrame = 0
  let lastTime = performance.now()
  let frames = 0
  let fps = 0

  const update = (time: number) => {
    frames += 1
    if (time - lastTime >= 500) {
      fps = Math.round((frames * 1000) / (time - lastTime))
      frames = 0
      lastTime = time
    }
    const stats = readStats()
    overlay.textContent = `${stats.quality} · ${fps} FPS\nDPR ${stats.dpr.toFixed(2)}\n${stats.drawCalls} calls · ${stats.triangles.toLocaleString()} tris`
    animationFrame = requestAnimationFrame(update)
  }
  animationFrame = requestAnimationFrame(update)

  return () => {
    cancelAnimationFrame(animationFrame)
    overlay.remove()
  }
}
