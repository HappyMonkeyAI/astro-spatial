import { z } from 'zod'

export type Vec3 = readonly [number, number, number]

export type SpatialNodeKind =
  | 'scene'
  | 'camera'
  | 'model'
  | 'procedural-model'
  | 'light'
  | 'environment'
  | 'animation'
  | 'interaction'

export interface SpatialNode {
  readonly id: string
  readonly kind: SpatialNodeKind
  readonly children?: readonly SpatialNode[]
}

export interface SceneNode extends SpatialNode {
  readonly kind: 'scene'
  readonly fallback?: string
}

export interface CameraNode extends SpatialNode {
  readonly kind: 'camera'
  readonly position?: Vec3
  readonly target?: Vec3
  readonly fov?: number
}

export interface LightNode extends SpatialNode {
  readonly kind: 'light'
  readonly lightType: 'ambient' | 'directional' | 'point'
  readonly intensity?: number
  readonly position?: Vec3
}

export interface ModelNode extends SpatialNode {
  readonly kind: 'model' | 'procedural-model'
  readonly src: string
  readonly position?: Vec3
  readonly rotation?: Vec3
  readonly scale?: number | Vec3
}

export interface EnvironmentNode extends SpatialNode {
  readonly kind: 'environment'
  readonly src?: string
  readonly background?: string
}

export function cameraNode(
  id: string,
  options: Omit<CameraNode, 'id' | 'kind' | 'children'> = {},
): CameraNode {
  return { id, kind: 'camera', ...options }
}

export function modelNode(
  id: string,
  src: string,
  options: Omit<ModelNode, 'id' | 'kind' | 'src' | 'children'> = {},
): ModelNode {
  return { id, kind: 'model', src, ...options }
}

export function proceduralModelNode(
  id: string,
  src: string,
  options: Omit<ModelNode, 'id' | 'kind' | 'src' | 'children'> = {},
): ModelNode {
  return { id, kind: 'procedural-model', src, ...options }
}

export function lightNode(
  id: string,
  lightType: LightNode['lightType'],
  options: Omit<LightNode, 'id' | 'kind' | 'lightType' | 'children'> = {},
): LightNode {
  return { id, kind: 'light', lightType, ...options }
}

export function environmentNode(
  id: string,
  options: Omit<EnvironmentNode, 'id' | 'kind' | 'children'> = {},
): EnvironmentNode {
  return { id, kind: 'environment', ...options }
}

export interface SceneManifest {
  readonly schema: 'astro-spatial/scene'
  readonly version: 1
  readonly nodes: readonly SpatialNode[]
}

const vec3Schema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()])
const nodeChildrenSchema: z.ZodTypeAny = z.lazy(() => z.array(spatialNodeSchema)).optional()

export const spatialNodeSchema: z.ZodTypeAny = z.lazy((): z.ZodTypeAny => z.union([
  z.object({ id: z.string(), kind: z.literal('scene'), fallback: z.string().optional(), children: nodeChildrenSchema }).passthrough(),
  z.object({ id: z.string(), kind: z.literal('camera'), position: vec3Schema.optional(), target: vec3Schema.optional(), fov: z.number().finite().positive().optional(), children: nodeChildrenSchema }).passthrough(),
  z.object({ id: z.string(), kind: z.literal('light'), lightType: z.enum(['ambient', 'directional', 'point']), intensity: z.number().finite().nonnegative().optional(), position: vec3Schema.optional(), children: nodeChildrenSchema }).passthrough(),
  z.object({ id: z.string(), kind: z.literal('model'), src: z.string().min(1), position: vec3Schema.optional(), rotation: vec3Schema.optional(), scale: z.union([z.number().finite().positive(), vec3Schema]).optional(), children: nodeChildrenSchema }).passthrough(),
  z.object({ id: z.string(), kind: z.literal('procedural-model'), src: z.string().min(1), position: vec3Schema.optional(), rotation: vec3Schema.optional(), scale: z.union([z.number().finite().positive(), vec3Schema]).optional(), children: nodeChildrenSchema }).passthrough(),
  z.object({ id: z.string(), kind: z.literal('environment'), src: z.string().min(1).optional(), background: z.string().min(1).optional(), children: nodeChildrenSchema }).passthrough(),
  z.object({ id: z.string(), kind: z.literal('animation'), children: nodeChildrenSchema }).passthrough(),
  z.object({ id: z.string(), kind: z.literal('interaction'), children: nodeChildrenSchema }).passthrough(),
]))

export const sceneManifestSchema = z.object({
  schema: z.literal('astro-spatial/scene'),
  version: z.literal(1),
  nodes: z.array(spatialNodeSchema),
})

export function validateSceneManifest(input: unknown): SceneManifest {
  return sceneManifestSchema.parse(input) as SceneManifest
}

export function createSceneManifest(nodes: readonly SpatialNode[]): SceneManifest {
  const seen = new Set<string>()

  const visit = (node: SpatialNode) => {
    assertStableNodeId(node.id)
    if (seen.has(node.id)) throw new Error(`Duplicate spatial node id: ${node.id}`)
    seen.add(node.id)
    node.children?.forEach(visit)
  }

  nodes.forEach(visit)
  return validateSceneManifest({ schema: 'astro-spatial/scene', version: 1, nodes })
}

export function assertStableNodeId(id: string): void {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(`Invalid spatial node id: ${id}`)
  }
}
