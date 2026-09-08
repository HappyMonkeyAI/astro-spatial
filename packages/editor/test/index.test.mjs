import assert from 'node:assert/strict'
import test from 'node:test'
import { SceneEditor, replaceSceneManifestSource, serializeSceneManifest } from '../dist/index.js'

const manifest = { schema: 'astro-spatial/scene', version: 1, nodes: [{ id: 'hero', kind: 'procedural-model', src: 'preview', position: [0, 0, 0] }] }

test('editor transforms support selection, undo, and redo', () => {
  const editor = new SceneEditor(manifest)
  editor.select('hero'); editor.setTransform('hero', { position: [1, 2, 3], scale: 2 })
  assert.deepEqual(editor.getManifest().nodes[0].position, [1, 2, 3])
  assert.equal(editor.undo(), true); assert.deepEqual(editor.getManifest().nodes[0].position, [0, 0, 0])
  assert.equal(editor.redo(), true); assert.equal(editor.getManifest().nodes[0].scale, 2)
})

test('manifest serialization is deterministic and source replacement is idempotent', () => {
  const block = replaceSceneManifestSource('page\n', manifest, 'hero')
  assert.match(block, /astro-spatial:scene hero/)
  assert.equal(replaceSceneManifestSource(block, manifest, 'hero'), block)
  assert.match(serializeSceneManifest(manifest), /"version": 1/)
})
