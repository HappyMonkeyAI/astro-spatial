export type Vec3 = readonly [number, number, number]

export interface PhysicsBodyDefinition {
  readonly id: string
  readonly position: Vec3
  readonly velocity?: Vec3
  readonly mass?: number
  readonly radius?: number
  readonly static?: boolean
}

export interface PhysicsBodyState { readonly id: string; readonly position: Vec3; readonly velocity: Vec3 }
export interface PhysicsWorldOptions { readonly gravity?: Vec3; readonly groundY?: number; readonly restitution?: number }
export interface PhysicsStepResult { readonly time: number; readonly bodies: readonly PhysicsBodyState[] }

interface MutableBody {
  id: string
  position: [number, number, number]
  velocity: [number, number, number]
  mass: number
  radius: number
  static: boolean
}

const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback
const vec = (value: Vec3 | undefined, fallback: Vec3): [number, number, number] => [
  finite(value?.[0] ?? fallback[0], fallback[0]), finite(value?.[1] ?? fallback[1], fallback[1]), finite(value?.[2] ?? fallback[2], fallback[2]),
]
const cloneBody = (body: MutableBody): PhysicsBodyState => ({ id: body.id, position: [...body.position], velocity: [...body.velocity] })

export class PhysicsWorld {
  readonly gravity: Vec3
  readonly groundY: number
  readonly restitution: number
  private time = 0
  private readonly bodies = new Map<string, MutableBody>()

  constructor(options: PhysicsWorldOptions = {}) {
    this.gravity = vec(options.gravity, [0, -9.81, 0])
    this.groundY = finite(options.groundY ?? 0, 0)
    this.restitution = Math.max(0, Math.min(1, finite(options.restitution ?? 0.35, 0.35)))
  }

  addBody(definition: PhysicsBodyDefinition): void {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.id)) throw new Error(`Invalid physics body id: ${definition.id}`)
    if (this.bodies.has(definition.id)) throw new Error(`Duplicate physics body id: ${definition.id}`)
    this.bodies.set(definition.id, { id: definition.id, position: vec(definition.position, [0, 0, 0]), velocity: vec(definition.velocity, [0, 0, 0]), mass: Math.max(0.0001, finite(definition.mass ?? 1, 1)), radius: Math.max(0, finite(definition.radius ?? 0.5, 0.5)), static: Boolean(definition.static) })
  }

  removeBody(id: string): boolean { return this.bodies.delete(id) }

  step(deltaSeconds: number): PhysicsStepResult {
    const dt = Math.max(0, Math.min(0.1, finite(deltaSeconds, 0)))
    for (const body of this.bodies.values()) {
      if (body.static || dt === 0) continue
      body.velocity[0] += this.gravity[0] * dt; body.velocity[1] += this.gravity[1] * dt; body.velocity[2] += this.gravity[2] * dt
      body.position[0] += body.velocity[0] * dt; body.position[1] += body.velocity[1] * dt; body.position[2] += body.velocity[2] * dt
      const floor = this.groundY + body.radius
      if (body.position[1] < floor) { body.position[1] = floor; if (body.velocity[1] < 0) body.velocity[1] = -body.velocity[1] * this.restitution }
    }
    this.time += dt
    return { time: this.time, bodies: [...this.bodies.values()].map(cloneBody) }
  }

  snapshot(): PhysicsStepResult { return { time: this.time, bodies: [...this.bodies.values()].map(cloneBody) } }
}

export type PhysicsWorkerRequest =
  | { readonly type: 'add'; readonly body: PhysicsBodyDefinition }
  | { readonly type: 'remove'; readonly id: string }
  | { readonly type: 'step'; readonly deltaSeconds: number }
  | { readonly type: 'snapshot' }
export type PhysicsWorkerResponse = { readonly type: 'state'; readonly result: PhysicsStepResult } | { readonly type: 'error'; readonly message: string }
export interface PhysicsWorkerPort { postMessage(message: PhysicsWorkerResponse): void; addEventListener(type: 'message', listener: (event: { data: PhysicsWorkerRequest }) => void): void; removeEventListener(type: 'message', listener: (event: { data: PhysicsWorkerRequest }) => void): void }

export function attachPhysicsWorker(port: PhysicsWorkerPort, world = new PhysicsWorld()): () => void {
  const handle = (event: { data: PhysicsWorkerRequest }) => {
    try {
      const request = event.data
      if (request.type === 'add') world.addBody(request.body)
      if (request.type === 'remove') world.removeBody(request.id)
      const result = request.type === 'step' ? world.step(request.deltaSeconds) : world.snapshot()
      port.postMessage({ type: 'state', result })
    } catch (error) { port.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) }) }
  }
  port.addEventListener('message', handle)
  return () => port.removeEventListener('message', handle)
}
