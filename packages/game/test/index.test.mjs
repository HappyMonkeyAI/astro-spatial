import assert from 'node:assert/strict'
import test from 'node:test'
import { CombatWorld } from '../dist/index.js'

test('enemy AI chooses chase, attacks in range, and respects cooldowns', () => {
  const world = new CombatWorld()
  world.addCombatant({ id: 'enemy', position: [0, 0, 0], health: 10, maxHealth: 10, attackPower: 3, attackRange: 2, attackCooldown: 1 })
  world.addCombatant({ id: 'player', position: [5, 0, 0], health: 10, maxHealth: 10 })
  world.addEnemy({ id: 'enemy', targetId: 'player' })
  assert.equal(world.update(0.1).length, 0); assert.equal(world.getEnemy('enemy').state, 'chase')
  world.addCombatant({ id: 'close', position: [1, 0, 0], health: 1, maxHealth: 1 })
  world.setEnemyTarget('enemy', 'close')
  const first = world.update(0.1)
  assert.equal(first.some((event) => event.type === 'damage'), true)
  assert.equal(world.update(0.1).some((event) => event.type === 'damage'), false)
  assert.equal(world.getCombatant('close').health, 0)
})

test('direct damage emits defeated events exactly once', () => {
  const world = new CombatWorld()
  world.addCombatant({ id: 'target', position: [0, 0, 0], health: 2, maxHealth: 2 })
  assert.equal(world.applyDamage('target', 'source', 3), true)
  assert.equal(world.applyDamage('target', 'source', 3), false)
  assert.equal(world.getCombatant('target').health, 0)
})
