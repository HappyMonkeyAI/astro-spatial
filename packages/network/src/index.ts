export type Vec3 = readonly [number, number, number]

export interface NetworkEntity { readonly id: string; readonly position: Vec3; readonly rotation?: Vec3 }
export interface WorldSnapshot { readonly roomId: string; readonly sequence: number; readonly serverTime: number; readonly entities: readonly NetworkEntity[] }
export type ClientMessage = { readonly type: 'input'; readonly clientId: string; readonly sequence: number; readonly payload: Record<string, unknown> }
export type ServerMessage = { readonly type: 'snapshot'; readonly snapshot: WorldSnapshot }

export interface SnapshotTransport {
  send(message: ClientMessage): void
  onSnapshot(listener: (snapshot: WorldSnapshot) => void): () => void
}

export class AuthoritativeRoom {
  readonly roomId: string
  private sequence = 0
  private readonly entities = new Map<string, NetworkEntity>()

  constructor(roomId: string) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(roomId)) throw new Error(`Invalid room id: ${roomId}`)
    this.roomId = roomId
  }

  upsertEntity(entity: NetworkEntity): void { this.entities.set(entity.id, { ...entity, position: [...entity.position] }) }
  removeEntity(id: string): boolean { return this.entities.delete(id) }
  applyInput(_message: ClientMessage): void { /* Simulation ownership stays on the server/physics layer. */ }
  snapshot(serverTime: number): WorldSnapshot { return { roomId: this.roomId, sequence: ++this.sequence, serverTime, entities: [...this.entities.values()] } }
}

export interface InterpolatedEntity { readonly id: string; readonly position: Vec3; readonly rotation?: Vec3 }

export class SnapshotInterpolator {
  private previous: WorldSnapshot | undefined
  private current: WorldSnapshot | undefined

  push(snapshot: WorldSnapshot): boolean {
    if (this.current && (snapshot.roomId !== this.current.roomId || snapshot.sequence <= this.current.sequence)) return false
    this.previous = this.current
    this.current = snapshot
    return true
  }

  sample(serverTime: number): readonly InterpolatedEntity[] {
    if (!this.current) return []
    const previous = this.previous
    if (!previous || this.current.serverTime <= previous.serverTime) return this.current.entities
    const alpha = Math.max(0, Math.min(1, (serverTime - previous.serverTime) / (this.current.serverTime - previous.serverTime)))
    const old = new Map(previous.entities.map((entity) => [entity.id, entity]))
    return this.current.entities.map((entity) => {
      const prior = old.get(entity.id)
      if (!prior) return entity
      const position: Vec3 = [
        prior.position[0] + (entity.position[0] - prior.position[0]) * alpha,
        prior.position[1] + (entity.position[1] - prior.position[1]) * alpha,
        prior.position[2] + (entity.position[2] - prior.position[2]) * alpha,
      ]
      return { ...entity, position }
    })
  }
}

export function createSnapshotTransport(transport: SnapshotTransport, interpolator = new SnapshotInterpolator()): { send: SnapshotTransport['send']; sample: (serverTime: number) => readonly InterpolatedEntity[]; dispose: () => void } {
  const dispose = transport.onSnapshot((snapshot) => interpolator.push(snapshot))
  return { send: (message) => transport.send(message), sample: (serverTime) => interpolator.sample(serverTime), dispose }
}
