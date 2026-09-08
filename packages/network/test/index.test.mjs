import assert from 'node:assert/strict'
import test from 'node:test'
import { AuthoritativeRoom, SnapshotInterpolator } from '../dist/index.js'

test('authoritative room emits monotonic snapshots', () => {
  const room = new AuthoritativeRoom('demo-room')
  room.upsertEntity({ id: 'hero', position: [0, 0, 0] })
  assert.equal(room.snapshot(100).sequence, 1)
  room.upsertEntity({ id: 'hero', position: [10, 0, 0] })
  assert.equal(room.snapshot(200).sequence, 2)
})

test('interpolator rejects stale snapshots and blends positions', () => {
  const interpolator = new SnapshotInterpolator()
  assert.equal(interpolator.push({ roomId: 'room', sequence: 1, serverTime: 0, entities: [{ id: 'hero', position: [0, 0, 0] }] }), true)
  assert.equal(interpolator.push({ roomId: 'room', sequence: 1, serverTime: 1, entities: [{ id: 'hero', position: [10, 0, 0] }] }), false)
  assert.equal(interpolator.push({ roomId: 'room', sequence: 2, serverTime: 1, entities: [{ id: 'hero', position: [10, 0, 0] }] }), true)
  assert.deepEqual(interpolator.sample(0.5)[0].position, [5, 0, 0])
})
