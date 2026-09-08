import type { CameraNode, EnvironmentNode, ModelNode, SceneManifest } from '@astro-spatial/core'
import * as THREE from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface SpatialRendererOptions {
  readonly maxDpr?: number
  readonly reducedMotion?: boolean
  readonly quality?: SpatialQuality
  readonly adaptiveQuality?: boolean
}

export type ProceduralModelFactory = () => THREE.Object3D

const proceduralFactories = new Map<string, ProceduralModelFactory>()

export function registerProceduralFactory(src: string, factory: ProceduralModelFactory): () => void {
  if (!src.trim()) throw new Error('A procedural factory source is required')
  proceduralFactories.set(src, factory)
  return () => {
    if (proceduralFactories.get(src) === factory) proceduralFactories.delete(src)
  }
}

export type SpatialQuality = 'low' | 'medium' | 'high'

export interface SpatialQualityProfile {
  readonly quality: SpatialQuality
  readonly maxDpr: number
  readonly targetFrameMs: number
  readonly maxVisibleTriangles: number
  readonly maxDrawCalls: number
}

const QUALITY_PROFILES: Record<SpatialQuality, SpatialQualityProfile> = {
  low: {
    quality: 'low',
    maxDpr: 1.25,
    targetFrameMs: 25,
    maxVisibleTriangles: 150_000,
    maxDrawCalls: 60,
  },
  medium: {
    quality: 'medium',
    maxDpr: 1.5,
    targetFrameMs: 16.7,
    maxVisibleTriangles: 300_000,
    maxDrawCalls: 100,
  },
  high: {
    quality: 'high',
    maxDpr: 2,
    targetFrameMs: 16.7,
    maxVisibleTriangles: 1_200_000,
    maxDrawCalls: 160,
  },
}

export function getSpatialQualityProfile(quality: SpatialQuality = 'medium'): SpatialQualityProfile {
  return QUALITY_PROFILES[quality]
}

const QUALITY_ORDER: readonly SpatialQuality[] = ['low', 'medium', 'high']

export function chooseAdaptiveQuality(current: SpatialQuality, averageFrameMs: number): SpatialQuality {
  const index = QUALITY_ORDER.indexOf(current)
  const profile = getSpatialQualityProfile(current)
  if (averageFrameMs > profile.targetFrameMs * 1.25 && index > 0) return QUALITY_ORDER[index - 1]!
  if (averageFrameMs < profile.targetFrameMs * 0.65 && index < QUALITY_ORDER.length - 1) return QUALITY_ORDER[index + 1]!
  return current
}

export interface SpatialRenderer {
  readonly canvas: HTMLCanvasElement
  render(manifest: SceneManifest): Promise<void>
  resize(width: number, height: number): void
  setProgress(progress: number): void
  setCameraState(state: { readonly position: readonly [number, number, number]; readonly target: readonly [number, number, number]; readonly fov?: number }): void
  getStats(): SpatialRuntimeStats
  getScene(): THREE.Scene
  getCamera(): THREE.Camera
  getObject(id: string): THREE.Object3D | undefined
  action(action: SpatialAction): void
  dispose(): void
}

export interface SpatialRuntimeStats {
  readonly quality: SpatialQuality
  readonly dpr: number
  readonly drawCalls: number
  readonly triangles: number
}

export type SpatialAction =
  | { readonly type: 'focus'; readonly targetId: string }
  | { readonly type: 'pulse'; readonly targetId: string }

function flattenNodes(manifest: SceneManifest) {
  const nodes: SceneManifest['nodes'][number][] = []
  const visit = (node: SceneManifest['nodes'][number]) => {
    nodes.push(node)
    node.children?.forEach(visit)
  }
  manifest.nodes.forEach(visit)
  return nodes
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose()
      })
      material.dispose()
    })
  })
}

/** Creates the first WebGL renderer implementation with a procedural preview model. */
export function createSpatialRenderer(
  canvas: HTMLCanvasElement,
  options: SpatialRendererOptions = {},
): SpatialRenderer {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#080b12')

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 1.2, 5)

  let quality = options.quality ?? 'medium'
  let profile = getSpatialQualityProfile(quality)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: profile.quality !== 'low',
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr ?? profile.maxDpr))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene.add(new THREE.HemisphereLight('#dcecff', '#101522', 1.5))
  const key = new THREE.DirectionalLight('#ffffff', 2.4)
  key.position.set(3, 4, 4)
  scene.add(key)

  const root = new THREE.Group()
  scene.add(root)
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let loaderPromise: Promise<GLTFLoader> | undefined
  let interactiveObject: THREE.Object3D | undefined
  let previewMaterial: THREE.MeshStandardMaterial | undefined
  let animationFrame = 0
  let disposed = false
  let renderRevision = 0
  let pulseTimeout: number | undefined
  let storyProgress = 0
  const nodeObjects = new Map<string, THREE.Object3D>()
  let frameSampleStart = performance.now()
  let frameSampleCount = 0

  const updateHover = (event: PointerEvent) => {
    if (!interactiveObject) return
    const bounds = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hovered = raycaster.intersectObject(interactiveObject, true).length > 0
    if (previewMaterial) {
      previewMaterial.emissiveIntensity = hovered ? 0.45 : 0.05
      canvas.style.cursor = hovered ? 'pointer' : 'default'
    }
  }

  const clearHover = () => {
    if (previewMaterial) previewMaterial.emissiveIntensity = 0.05
    canvas.style.cursor = 'default'
  }

  canvas.addEventListener('pointermove', updateHover)
  canvas.addEventListener('pointerleave', clearHover)

  const render = async (manifest: SceneManifest) => {
    const revision = ++renderRevision
    root.children.slice().forEach((child) => {
      disposeObject(child)
      root.remove(child)
    })
    nodeObjects.clear()
    interactiveObject = undefined
    previewMaterial = undefined

    const modelNode = flattenNodes(manifest).find(
      (node): node is ModelNode => node.kind === 'model' || node.kind === 'procedural-model',
    )
    const position = modelNode?.position
    const scale = modelNode?.scale

    if (modelNode?.src && modelNode.src !== 'preview') {
      try {
        if (modelNode.kind === 'procedural-model') {
          const factory = proceduralFactories.get(modelNode.src)
          if (!factory) throw new Error(`No procedural factory registered for ${modelNode.src}`)
          interactiveObject = factory()
          if (disposed || revision !== renderRevision) {
            disposeObject(interactiveObject)
            return
          }
          root.add(interactiveObject)
          nodeObjects.set(modelNode.id, interactiveObject)
        } else {
          loaderPromise ??= import('three/examples/jsm/loaders/GLTFLoader.js').then(
            ({ GLTFLoader }) => new GLTFLoader(),
          )
          const loader = await loaderPromise
          const gltf = await loader.loadAsync(modelNode.src)
          if (disposed || revision !== renderRevision) {
            disposeObject(gltf.scene)
            return
          }
          interactiveObject = gltf.scene
          root.add(gltf.scene)
          nodeObjects.set(modelNode.id, gltf.scene)
        }
      } catch (error) {
        console.warn(`Unable to load spatial model ${modelNode.src}; using preview geometry.`, error)
      }
    }

    if (!interactiveObject) {
      previewMaterial = new THREE.MeshStandardMaterial({
        color: '#8c7bff',
        roughness: 0.28,
        metalness: 0.2,
        emissive: '#5e4fff',
        emissiveIntensity: 0.05,
      })
      interactiveObject = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), previewMaterial)
      root.add(interactiveObject)
      if (modelNode) nodeObjects.set(modelNode.id, interactiveObject)
    }

    interactiveObject.position.set(...(position ?? [0, 0, 0]))
    if (typeof scale === 'number') interactiveObject.scale.setScalar(scale)
    else if (scale) interactiveObject.scale.set(...scale)

    const cameraNode = flattenNodes(manifest).find(
      (node): node is CameraNode => node.kind === 'camera',
    )
    if (cameraNode?.position) camera.position.set(...cameraNode.position)
    if (cameraNode?.fov) {
      camera.fov = cameraNode.fov
      camera.updateProjectionMatrix()
    }
    const environment = flattenNodes(manifest).find(
      (node): node is EnvironmentNode => node.kind === 'environment',
    )
    if (environment?.background) {
      try { scene.background = new THREE.Color(environment.background) } catch { /* keep the safe default */ }
    }
  }

  const frame = (time: number) => {
    if (disposed) return
    if (interactiveObject && !options.reducedMotion) {
      interactiveObject.rotation.y = time * 0.00035 + storyProgress * Math.PI * 0.35
    }
    renderer.render(scene, camera)
    if (options.adaptiveQuality) {
      frameSampleCount += 1
      if (frameSampleCount >= 30) {
        const averageFrameMs = (time - frameSampleStart) / frameSampleCount
        const nextQuality = chooseAdaptiveQuality(quality, averageFrameMs)
        if (nextQuality !== quality) {
          quality = nextQuality
          profile = getSpatialQualityProfile(quality)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr ?? profile.maxDpr))
        }
        frameSampleStart = time
        frameSampleCount = 0
      }
    }
    animationFrame = window.requestAnimationFrame(frame)
  }

  const resize = (width: number, height: number) => {
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
  }

  const getStats = (): SpatialRuntimeStats => ({
    quality: profile.quality,
    dpr: renderer.getPixelRatio(),
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
  })

  const setProgress = (progress: number) => {
    storyProgress = Math.min(1, Math.max(0, progress))
  }

  const setCameraState = (state: { readonly position: readonly [number, number, number]; readonly target: readonly [number, number, number]; readonly fov?: number }) => {
    camera.position.set(...state.position)
    camera.lookAt(...state.target)
    if (state.fov !== undefined) { camera.fov = state.fov; camera.updateProjectionMatrix() }
  }

  const action = (request: SpatialAction) => {
    const target = nodeObjects.get(request.targetId)
    if (!target) return
    if (request.type === 'focus') {
      camera.lookAt(target.position)
      return
    }
    if (pulseTimeout !== undefined) window.clearTimeout(pulseTimeout)
    target.scale.multiplyScalar(1.18)
    pulseTimeout = window.setTimeout(() => {
      target.scale.multiplyScalar(1 / 1.18)
      pulseTimeout = undefined
    }, 220)
  }

  const initialWidth = canvas.clientWidth || 800
  const initialHeight = canvas.clientHeight || 520
  resize(initialWidth, initialHeight)
  animationFrame = window.requestAnimationFrame(frame)

  return {
    canvas,
    render,
    resize,
    setProgress,
    setCameraState,
    getStats,
    getScene: () => scene,
    getCamera: () => camera,
    getObject: (id: string) => nodeObjects.get(id),
    action,
    dispose() {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      if (pulseTimeout !== undefined) window.clearTimeout(pulseTimeout)
      nodeObjects.clear()
      root.children.slice().forEach(disposeObject)
      renderer.dispose()
      canvas.removeEventListener('pointermove', updateHover)
      canvas.removeEventListener('pointerleave', clearHover)
    },
  }
}
