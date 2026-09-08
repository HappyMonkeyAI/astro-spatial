import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeAssets, analyzeScene, formatDiagnostics } from '../dist/index.js'

test('reports scene structure warnings', () => {
  const diagnostics = analyzeScene({ schema: 'astro-spatial/scene', version: 1, nodes: [] })
  assert.equal(diagnostics.length, 2)
  assert.match(formatDiagnostics(diagnostics), /SCENE_NO_CAMERA/)
})

test('reports asset budget warnings and provenance hints', () => {
  const diagnostics = analyzeAssets([
    { id: 'hero', kind: 'glb', src: 'hero.glb', triangleBudget: 120_000 },
  ], { maxTriangleBudget: 100_000 })
  assert.equal(diagnostics.length, 2)
  assert.match(formatDiagnostics(diagnostics), /TRIANGLE_BUDGET_HIGH/)
})
