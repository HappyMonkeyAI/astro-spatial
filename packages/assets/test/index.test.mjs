import assert from 'node:assert/strict'
import test from 'node:test'
import { createAssetManifest, validateAssetDefinition } from '../dist/index.js'

test('creates a manifest for imported and procedural assets', () => {
  const manifest = createAssetManifest([
    { id: 'hero-model', kind: 'glb', src: '/models/hero.glb', metersPerUnit: 1 },
    { id: 'procedural-hero', kind: 'img2threejs', src: '/models/hero.ts', triangleBudget: 50000 },
  ])
  assert.equal(manifest.schema, 'astro-spatial/assets')
  assert.equal(manifest.assets.length, 2)
})

test('rejects unsafe asset definitions', () => {
  assert.throws(
    () => validateAssetDefinition({ id: 'bad-asset', kind: 'glb', src: '', metersPerUnit: 1 }),
    /must define a source/,
  )
  assert.throws(
    () => createAssetManifest([
      { id: 'same-asset', kind: 'glb', src: 'a.glb' },
      { id: 'same-asset', kind: 'procedural', src: 'b.ts' },
    ]),
    /Duplicate spatial asset id/,
  )
})
