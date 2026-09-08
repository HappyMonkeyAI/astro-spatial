import { validateSceneManifest, type SceneManifest, type SpatialNode, type Vec3 } from '@astro-spatial/core'

export interface EditorSelection { readonly nodeId: string | undefined }
export type TransformPatch = { position?: Vec3; rotation?: Vec3; scale?: number | Vec3 }
export interface EditorChange { readonly type: 'transform'; readonly nodeId: string; readonly before: TransformPatch; readonly after: TransformPatch }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const findNode = (nodes: readonly SpatialNode[], id: string): SpatialNode | undefined => {
  for (const node of nodes) { if (node.id === id) return node; const child = node.children && findNode(node.children, id); if (child) return child }
  return undefined
}
const updateNode = (nodes: readonly SpatialNode[], id: string, patch: TransformPatch): SpatialNode[] => nodes.map((node) => node.id === id ? { ...node, ...patch } : { ...node, ...(node.children ? { children: updateNode(node.children, id, patch) } : {}) })

export class SceneEditor {
  private manifest: SceneManifest
  private selection: EditorSelection = { nodeId: undefined }
  private undoStack: EditorChange[] = []
  private redoStack: EditorChange[] = []

  constructor(manifest: SceneManifest) { this.manifest = clone(validateSceneManifest(manifest)) }
  getManifest(): SceneManifest { return clone(this.manifest) }
  getSelection(): EditorSelection { return this.selection }
  select(nodeId: string | undefined): EditorSelection { if (nodeId && !findNode(this.manifest.nodes, nodeId)) throw new Error(`Unknown scene node: ${nodeId}`); this.selection = { nodeId }; return this.selection }
  setTransform(nodeId: string, patch: TransformPatch): EditorChange {
    const node = findNode(this.manifest.nodes, nodeId)
    if (!node) throw new Error(`Unknown scene node: ${nodeId}`)
    const before: TransformPatch = {}; const after: TransformPatch = {}
    const existing = node as SpatialNode & TransformPatch
    for (const key of ['position', 'rotation', 'scale'] as const) {
      if (patch[key] !== undefined) {
        if (existing[key] !== undefined) before[key] = clone(existing[key]) as never
        after[key] = clone(patch[key]) as never
      }
    }
    const change = { type: 'transform' as const, nodeId, before, after }
    this.manifest = { ...this.manifest, nodes: updateNode(this.manifest.nodes, nodeId, after) }
    this.undoStack.push(change); this.redoStack = []; this.selection = { nodeId }; return clone(change)
  }
  undo(): boolean { const change = this.undoStack.pop(); if (!change) return false; this.manifest = { ...this.manifest, nodes: updateNode(this.manifest.nodes, change.nodeId, change.before) }; this.redoStack.push(change); return true }
  redo(): boolean { const change = this.redoStack.pop(); if (!change) return false; this.manifest = { ...this.manifest, nodes: updateNode(this.manifest.nodes, change.nodeId, change.after) }; this.undoStack.push(change); return true }
}

export function serializeSceneManifest(manifest: SceneManifest): string { return `${JSON.stringify(validateSceneManifest(manifest), null, 2)}\n` }

export function replaceSceneManifestSource(source: string, manifest: SceneManifest, id: string): string {
  const start = `<!-- astro-spatial:scene ${id} -->`
  const end = `<!-- /astro-spatial:scene ${id} -->`
  const block = `${start}\n${serializeSceneManifest(manifest)}${end}`
  const expression = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  return expression.test(source) ? source.replace(expression, block) : `${source.trimEnd()}\n\n${block}\n`
}
