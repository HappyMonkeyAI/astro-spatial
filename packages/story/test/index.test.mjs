import assert from 'node:assert/strict'
import test from 'node:test'
import {
  chapterProgress,
  damp,
  interpolateSpatialKeyframes,
  progressFromScroll,
  updateStoryState,
} from '../dist/index.js'

const chapters = [
  { id: 'arrival' },
  { id: 'reveal', scrollWeight: 2 },
  { id: 'departure' },
]

test('maps exact story progress to an adjacent chapter pair', () => {
  assert.deepEqual(chapterProgress(chapters, 1.25), {
    index: 1,
    id: 'reveal',
    nextIndex: 2,
    nextId: 'departure',
    localProgress: 0.25,
  })
})

test('scroll progress is deterministic and clamped', () => {
  assert.equal(progressFromScroll(0, 2000, 1000), 0)
  assert.equal(progressFromScroll(500, 2000, 1000), 0.5)
  assert.equal(progressFromScroll(3000, 2000, 1000), 1)
})

test('reduced motion follows exact target state', () => {
  const state = updateStoryState({ target: 2, smooth: 0 }, 0.016, true)
  assert.equal(state.smooth, 2)
  assert.ok(damp(0, 1, 5.2, 0.016) > 0)
})

test('interpolates camera keyframes and clamps progress', () => {
  const keyframes = [
    { id: 'start', progress: 0, position: [0, 0, 5], target: [0, 0, 0], fov: 40 },
    { id: 'end', progress: 1, position: [10, 2, 5], target: [1, 1, 0], fov: 60 },
  ]
  assert.deepEqual(interpolateSpatialKeyframes(keyframes, 0.5), { position: [5, 1, 5], target: [0.5, 0.5, 0], fov: 50 })
  assert.deepEqual(interpolateSpatialKeyframes(keyframes, 2).position, [10, 2, 5])
})
