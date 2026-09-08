import type { SceneManifest } from '@astro-spatial/core'

export interface MountSpatialSceneOptions {
  readonly maxDpr?: number
  readonly reducedMotion?: boolean
  readonly quality?: 'low' | 'medium' | 'high'
  readonly sceneId?: string
  readonly storyId?: string
  readonly debug?: boolean
  readonly adaptiveQuality?: boolean
  readonly pointerParallax?: boolean
}

export async function mountSpatialScene(
  canvas: HTMLCanvasElement,
  manifest: SceneManifest,
  options: MountSpatialSceneOptions = {},
): Promise<() => void> {
  const [{ createSpatialRenderer }, { validateSceneManifest }] = await Promise.all([
    import('@astro-spatial/three'),
    import('@astro-spatial/core'),
  ])
  const renderer = createSpatialRenderer(canvas, options)
  await renderer.render(validateSceneManifest(manifest))
  let overlayCleanup: (() => void) | undefined
  if (options.debug) {
    const { mountRuntimeOverlay } = await import('@astro-spatial/devtools')
    const host = canvas.parentElement
    if (host) overlayCleanup = mountRuntimeOverlay(host, renderer.getStats)
  }

  const handleStoryProgress = (event: Event) => {
    const customEvent = event as CustomEvent<{ storyId?: string; progress?: number; camera?: { position: [number, number, number]; target: [number, number, number]; fov?: number } }>
    const detail = customEvent.detail
    if (!detail || (options.storyId && detail.storyId !== options.storyId)) return
    if (typeof detail.progress === 'number' && Number.isFinite(detail.progress)) {
      renderer.setProgress(detail.progress)
    }
    if (detail.camera) renderer.setCameraState(detail.camera)
  }
  document.addEventListener('astro-spatial:story-progress', handleStoryProgress)

  const handleAction = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const control = target.closest<HTMLElement>('[data-spatial-action]')
    if (!control) return
    const controlSceneId = control.dataset.spatialSceneTarget
    if (options.sceneId && controlSceneId && controlSceneId !== options.sceneId) return
    const action = control.dataset.spatialAction
    const targetId = control.dataset.spatialTarget
    if (!targetId || (action !== 'focus' && action !== 'pulse')) return
    renderer.action({ type: action, targetId })
  }

  document.addEventListener('click', handleAction)

  const resize = () => renderer.resize(canvas.clientWidth, canvas.clientHeight)
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  const cleanup = () => {
    observer.disconnect()
    document.removeEventListener('click', handleAction)
    document.removeEventListener('astro-spatial:story-progress', handleStoryProgress)
    overlayCleanup?.()
    renderer.dispose()
  }
  window.addEventListener('pagehide', cleanup, { once: true })
  const hot = (import.meta as ImportMeta & {
    hot?: { dispose(callback: () => void): void }
  }).hot
  hot?.dispose(cleanup)
  return cleanup
}
