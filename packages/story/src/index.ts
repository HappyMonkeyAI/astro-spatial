export interface StoryChapter {
  readonly id: string
  readonly scrollWeight?: number
}

export interface ChapterProgress {
  readonly index: number
  readonly id: string
  readonly nextIndex: number
  readonly nextId: string
  readonly localProgress: number
}

export interface StoryState {
  readonly target: number
  readonly smooth: number
}

export type Vec3 = readonly [number, number, number]
export interface CameraKeyframe { readonly position: Vec3; readonly target: Vec3; readonly fov?: number }
export interface SpatialKeyframe extends CameraKeyframe { readonly id: string; readonly progress: number }

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

export function validateChapters(chapters: readonly StoryChapter[]): void {
  if (chapters.length === 0) throw new Error('A story requires at least one chapter')
  const ids = new Set<string>()
  chapters.forEach((chapter) => {
    if (!chapter.id.trim()) throw new Error('Story chapter ids cannot be empty')
    if (ids.has(chapter.id)) throw new Error(`Duplicate story chapter id: ${chapter.id}`)
    if (chapter.scrollWeight !== undefined && (!Number.isFinite(chapter.scrollWeight) || chapter.scrollWeight <= 0)) {
      throw new Error(`Story chapter ${chapter.id} must have a positive scroll weight`)
    }
    ids.add(chapter.id)
  })
}

export function chapterProgress(
  chapters: readonly StoryChapter[],
  progress: number,
): ChapterProgress {
  validateChapters(chapters)
  const target = clamp(progress, 0, Math.max(chapters.length - 1, 0))
  const index = Math.min(Math.floor(target), chapters.length - 1)
  const nextIndex = Math.min(index + 1, chapters.length - 1)
  const current = chapters[index]!
  const next = chapters[nextIndex]!
  return {
    index,
    id: current.id,
    nextIndex,
    nextId: next.id,
    localProgress: index === nextIndex ? 0 : target - index,
  }
}

export function progressFromScroll(scrollTop: number, scrollHeight: number, viewportHeight: number): number {
  const range = Math.max(scrollHeight - viewportHeight, 1)
  return clamp(scrollTop / range) * 1
}

export function damp(current: number, target: number, lambda: number, deltaSeconds: number): number {
  if (deltaSeconds <= 0 || lambda <= 0) return current
  return current + (target - current) * (1 - Math.exp(-lambda * deltaSeconds))
}

export function updateStoryState(
  state: StoryState,
  deltaSeconds: number,
  reducedMotion = false,
): StoryState {
  return {
    target: state.target,
    smooth: reducedMotion ? state.target : damp(state.smooth, state.target, 5.2, deltaSeconds),
  }
}

export function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * clamp(amount)
}

export function lerpVec3(a: Vec3, b: Vec3, amount: number): Vec3 {
  return [lerp(a[0], b[0], amount), lerp(a[1], b[1], amount), lerp(a[2], b[2], amount)]
}

export function interpolateSpatialKeyframes(keyframes: readonly SpatialKeyframe[], progress: number): CameraKeyframe {
  if (keyframes.length === 0) throw new Error('At least one spatial keyframe is required')
  for (let index = 1; index < keyframes.length; index += 1) {
    if (keyframes[index]!.progress < keyframes[index - 1]!.progress) throw new Error('Spatial keyframes must be sorted by progress')
  }
  const target = clamp(progress)
  const first = keyframes[0]!
  const last = keyframes[keyframes.length - 1]!
  const frame = (keyframe: CameraKeyframe): CameraKeyframe => keyframe.fov === undefined
    ? { position: keyframe.position, target: keyframe.target }
    : { position: keyframe.position, target: keyframe.target, fov: keyframe.fov }
  if (target <= first.progress) return frame(first)
  if (target >= last.progress) return frame(last)
  const nextIndex = keyframes.findIndex((keyframe) => keyframe.progress >= target)
  const next = keyframes[nextIndex]!
  const previous = keyframes[nextIndex - 1]!
  const span = Math.max(next.progress - previous.progress, Number.EPSILON)
  const amount = (target - previous.progress) / span
  const fov = previous.fov === undefined || next.fov === undefined ? next.fov ?? previous.fov : lerp(previous.fov, next.fov, amount)
  return fov === undefined
    ? { position: lerpVec3(previous.position, next.position, amount), target: lerpVec3(previous.target, next.target, amount) }
    : { position: lerpVec3(previous.position, next.position, amount), target: lerpVec3(previous.target, next.target, amount), fov }
}
