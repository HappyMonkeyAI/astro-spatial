import assert from 'node:assert/strict'
import test from 'node:test'
import { chooseAdaptiveQuality, getSpatialQualityProfile, registerProceduralFactory } from '../dist/index.js'

test('quality profiles expose explicit performance budgets', () => {
  const low = getSpatialQualityProfile('low')
  const high = getSpatialQualityProfile('high')

  assert.equal(low.maxDpr, 1.25)
  assert.ok(high.maxVisibleTriangles > low.maxVisibleTriangles)
  assert.ok(high.maxDrawCalls > low.maxDrawCalls)
})

test('medium is the default quality profile', () => {
  assert.equal(getSpatialQualityProfile().quality, 'medium')
})

test('adaptive quality changes only at meaningful frame-time thresholds', () => {
  assert.equal(chooseAdaptiveQuality('high', 30), 'medium')
  assert.equal(chooseAdaptiveQuality('low', 8), 'medium')
  assert.equal(chooseAdaptiveQuality('medium', 17), 'medium')
})

test('procedural factories can be registered and removed safely', () => {
  const factory = () => ({})
  const unregister = registerProceduralFactory('hero.ts', factory)
  assert.equal(typeof unregister, 'function')
  unregister()
})
