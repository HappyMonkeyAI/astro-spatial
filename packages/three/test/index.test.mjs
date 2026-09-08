import assert from 'node:assert/strict'
import test from 'node:test'
import {
  chooseAdaptiveQuality,
  getSpatialQualityProfile,
  registerProceduralFactory,
  waitForProceduralFactory,
} from '../dist/index.js'

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

test('waitForProceduralFactory resolves immediately when already registered', async () => {
  const factory = () => ({})
  const unregister = registerProceduralFactory('already-there', factory)
  try {
    const found = await waitForProceduralFactory('already-there', 5, 5)
    assert.equal(found, factory)
  } finally {
    unregister()
  }
})

test('waitForProceduralFactory picks up a registration that lands mid-wait', async () => {
  const factory = () => ({})
  const src = 'registers-late'
  let unregister
  setTimeout(() => { unregister = registerProceduralFactory(src, factory) }, 10)

  const found = await waitForProceduralFactory(src, 10, 10)
  assert.equal(found, factory)
  unregister?.()
})

test('waitForProceduralFactory gives up after exhausting its attempts', async () => {
  const found = await waitForProceduralFactory('never-registered', 3, 5)
  assert.equal(found, undefined)
})
