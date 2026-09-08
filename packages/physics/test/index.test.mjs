import assert from 'node:assert/strict'
import test from 'node:test'
import { PhysicsWorld, attachPhysicsWorker } from '../dist/index.js'

test('steps dynamic bodies deterministically and resolves the ground', () => {
  const world = new PhysicsWorld({ gravity: [0, -10, 0], restitution: 0 })
  world.addBody({ id: 'ball', position: [0, 2, 0], radius: 0.5 })
  assert.deepEqual(world.step(0.1).bodies[0].position, [0, 1.9, 0])
  for (let i = 0; i < 20; i += 1) world.step(0.1)
  assert.equal(world.snapshot().bodies[0].position[1], 0.5)
})

test('worker protocol forwards state and errors', () => {
  const listeners = new Set(); const messages = []
  const port = { postMessage(message) { messages.push(message) }, addEventListener(_type, listener) { listeners.add(listener) }, removeEventListener(_type, listener) { listeners.delete(listener) } }
  const detach = attachPhysicsWorker(port)
  for (const listener of listeners) listener({ data: { type: 'add', body: { id: 'box', position: [0, 1, 0] } } })
  for (const listener of listeners) listener({ data: { type: 'step', deltaSeconds: 1 / 60 } })
  assert.equal(messages.at(-1).type, 'state')
  for (const listener of listeners) listener({ data: { type: 'add', body: { id: 'box', position: [0, 1, 0] } } })
  assert.equal(messages.at(-1).type, 'error'); detach(); assert.equal(listeners.size, 0)
})
