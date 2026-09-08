export interface WebGpuRendererOptions {
  readonly antialias?: boolean
  readonly maxDpr?: number
}

export interface WebGpuRendererHandle {
  readonly renderer: unknown
  readonly canvas: HTMLCanvasElement
  dispose(): void
}

export function supportsWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export async function createWebGPURenderer(
  canvas: HTMLCanvasElement,
  options: WebGpuRendererOptions = {},
): Promise<WebGpuRendererHandle> {
  if (!supportsWebGPU()) {
    throw new Error('WebGPU is unavailable in this browser; use the WebGL renderer fallback.')
  }
  const { WebGPURenderer } = await import('three/webgpu')
  const renderer = new WebGPURenderer({
    canvas,
    antialias: options.antialias ?? true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr ?? 2))
  await renderer.init()
  return {
    renderer,
    canvas,
    dispose: () => renderer.dispose(),
  }
}

