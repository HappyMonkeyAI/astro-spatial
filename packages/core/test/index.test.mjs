import assert from 'node:assert/strict'
import test from 'node:test'
import { assertStableNodeId, cameraNode, createSceneManifest, proceduralModelNode, validateSceneManifest } from '../dist/index.js'

test('creates a versioned scene manifest', () => {
  const manifest = createSceneManifest([
    { id: 'hero-camera', kind: 'camera' },
    { id: 'hero-object', kind: 'procedural-model', src: 'preview' },
  ])

  assert.equal(manifest.schema, 'astro-spatial/scene')
  assert.equal(manifest.version, 1)
  assert.equal(manifest.nodes.length, 2)
})

test('rejects invalid and duplicate node ids', () => {
  assert.throws(() => assertStableNodeId('Hero Camera'), /Invalid spatial node id/)
  assert.throws(
    () => createSceneManifest([
      { id: 'same-node', kind: 'camera' },
      { id: 'same-node', kind: 'model', src: 'preview' },
    ]),
    /Duplicate spatial node id/,
  )
})

test('constructs typed authoring nodes', () => {
  const manifest = createSceneManifest([
    cameraNode('hero-camera', { position: [0, 1, 5] }),
    proceduralModelNode('hero-object', 'hero.ts', { scale: 1.2 }),
  ])
  assert.equal(manifest.nodes[0].kind, 'camera')
  assert.equal(manifest.nodes[1].kind, 'procedural-model')
})

test('validates serialized manifests and rejects malformed props', () => {
  assert.equal(validateSceneManifest({
    schema: 'astro-spatial/scene',
    version: 1,
    nodes: [{ id: 'camera', kind: 'camera', fov: 45 }],
  }).version, 1)
  assert.throws(() => validateSceneManifest({
    schema: 'astro-spatial/scene',
    version: 1,
    nodes: [{ id: 'model', kind: 'model', src: '', scale: 0 }],
  }), /String must contain at least 1 character|Number must be greater than 0/)
})
