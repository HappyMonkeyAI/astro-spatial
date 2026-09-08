export type EnemyState = 'idle' | 'chase' | 'attack' | 'defeated'
export type Vec3 = readonly [number, number, number]

export interface Combatant { readonly id: string; readonly position: Vec3; readonly health: number; readonly maxHealth: number; readonly attackPower?: number; readonly attackRange?: number; readonly attackCooldown?: number }
export interface Enemy { readonly id: string; readonly state: EnemyState; readonly targetId?: string; readonly cooldownRemaining: number }
export interface CombatEvent { readonly type: 'damage' | 'defeated' | 'attack'; readonly sourceId: string; readonly targetId: string; readonly amount?: number }
interface MutableEnemy { id: string; state: EnemyState; targetId: string | undefined; cooldownRemaining: number }

const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export class CombatWorld {
  private readonly combatants = new Map<string, Combatant>()
  private readonly enemies = new Map<string, MutableEnemy>()
  private readonly events: CombatEvent[] = []

  addCombatant(combatant: Combatant): void {
    if (this.combatants.has(combatant.id)) throw new Error(`Duplicate combatant id: ${combatant.id}`)
    this.combatants.set(combatant.id, { ...combatant, health: clamp(combatant.health, 0, combatant.maxHealth) })
  }

  addEnemy(enemy: Omit<Enemy, 'state' | 'cooldownRemaining'> & Partial<Pick<Enemy, 'state' | 'cooldownRemaining'>>): void {
    if (this.enemies.has(enemy.id)) throw new Error(`Duplicate enemy id: ${enemy.id}`)
    this.enemies.set(enemy.id, { id: enemy.id, state: enemy.state ?? 'idle', targetId: enemy.targetId, cooldownRemaining: Math.max(0, enemy.cooldownRemaining ?? 0) })
  }

  setEnemyTarget(enemyId: string, targetId: string | undefined): void {
    const enemy = this.enemies.get(enemyId); if (!enemy) throw new Error(`Unknown enemy id: ${enemyId}`)
    enemy.targetId = targetId
  }

  update(deltaSeconds: number): readonly CombatEvent[] {
    this.events.length = 0
    const dt = Math.max(0, Math.min(1, Number.isFinite(deltaSeconds) ? deltaSeconds : 0))
    for (const [id, enemy] of this.enemies) {
      const attacker = this.combatants.get(id)
      if (!attacker || attacker.health <= 0 || enemy.state === 'defeated') continue
      enemy.cooldownRemaining = Math.max(0, enemy.cooldownRemaining - dt)
      const target = enemy.targetId ? this.combatants.get(enemy.targetId) : undefined
      if (!target || target.health <= 0) { enemy.state = 'idle'; enemy.targetId = undefined; continue }
      const range = attacker.attackRange ?? 2
      if (distance(attacker.position, target.position) > range) { enemy.state = 'chase'; continue }
      enemy.state = 'attack'
      if (enemy.cooldownRemaining > 0) continue
      const damage = Math.max(0, attacker.attackPower ?? 1)
      this.events.push({ type: 'attack', sourceId: id, targetId: target.id })
      this.applyDamage(target.id, id, damage)
      enemy.cooldownRemaining = Math.max(0.01, attacker.attackCooldown ?? 1)
    }
    return this.events.map((event) => ({ ...event }))
  }

  applyDamage(targetId: string, sourceId: string, amount: number): boolean {
    const target = this.combatants.get(targetId); if (!target || target.health <= 0) return false
    const nextHealth = clamp(target.health - Math.max(0, amount), 0, target.maxHealth)
    this.combatants.set(targetId, { ...target, health: nextHealth })
    this.events.push({ type: 'damage', sourceId, targetId, amount: target.health - nextHealth })
    if (nextHealth === 0) this.events.push({ type: 'defeated', sourceId, targetId })
    return true
  }

  getCombatant(id: string): Combatant | undefined { const value = this.combatants.get(id); return value && { ...value } }
  getEnemy(id: string): Enemy | undefined {
    const value = this.enemies.get(id); if (!value) return undefined
    return value.targetId === undefined
      ? { id: value.id, state: value.state, cooldownRemaining: value.cooldownRemaining }
      : { id: value.id, state: value.state, targetId: value.targetId, cooldownRemaining: value.cooldownRemaining }
  }
}
