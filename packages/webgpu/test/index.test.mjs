import assert from 'node:assert/strict'
import test from 'node:test'
import { supportsWebGPU } from '../dist/index.js'

test('WebGPU detection is safe outside a browser', () => {
  assert.equal(typeof supportsWebGPU(), 'boolean')
})
