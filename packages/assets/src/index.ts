import { assertStableNodeId } from '@astro-spatial/core'

export type SpatialAssetKind = 'glb' | 'procedural' | 'img2threejs'

export interface AssetBounds {
  readonly width: number
  readonly height: number
  readonly depth: number
}

export interface SpatialAssetDefinition {
  readonly id: string
  readonly kind: SpatialAssetKind
  readonly src: string
  readonly provenance?: string
  readonly coordinateSystem?: '+Y-up,+Z-forward'
  readonly metersPerUnit?: number
  readonly bounds?: AssetBounds
  readonly triangleBudget?: number
  readonly textureBudgetBytes?: number
  readonly interactionTargets?: readonly string[]
}

export interface SpatialAssetManifest {
  readonly schema: 'astro-spatial/assets'
  readonly version: 1
  readonly assets: readonly SpatialAssetDefinition[]
}

function assertPositive(value: number | undefined, label: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
    throw new Error(`${label} must be a positive finite number`)
  }
}

export function validateAssetDefinition(asset: SpatialAssetDefinition): void {
  assertStableNodeId(asset.id)
  if (!asset.src.trim()) throw new Error(`Asset ${asset.id} must define a source`)
  assertPositive(asset.metersPerUnit, `${asset.id}.metersPerUnit`)
  assertPositive(asset.triangleBudget, `${asset.id}.triangleBudget`)
  assertPositive(asset.textureBudgetBytes, `${asset.id}.textureBudgetBytes`)
  if (asset.bounds) {
    assertPositive(asset.bounds.width, `${asset.id}.bounds.width`)
    assertPositive(asset.bounds.height, `${asset.id}.bounds.height`)
    assertPositive(asset.bounds.depth, `${asset.id}.bounds.depth`)
  }
  asset.interactionTargets?.forEach((target) => {
    if (!target.trim()) throw new Error(`Asset ${asset.id} contains an empty interaction target`)
  })
}

export function createAssetManifest(
  assets: readonly SpatialAssetDefinition[],
): SpatialAssetManifest {
  const seen = new Set<string>()
  assets.forEach((asset) => {
    validateAssetDefinition(asset)
    if (seen.has(asset.id)) throw new Error(`Duplicate spatial asset id: ${asset.id}`)
    seen.add(asset.id)
  })
  return { schema: 'astro-spatial/assets', version: 1, assets }
}

