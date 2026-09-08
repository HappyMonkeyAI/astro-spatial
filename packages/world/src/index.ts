export type WeatherPreset = 'clear' | 'rain' | 'fog' | 'snow'
export interface WeatherState { readonly preset: WeatherPreset; readonly intensity: number; readonly wind: readonly [number, number, number] }
export interface WeatherTransition { readonly from: WeatherState; readonly to: WeatherState; readonly progress: number }
export interface ArchitectureModule { readonly id: string; readonly type: 'room' | 'wall' | 'column' | 'platform'; readonly position: readonly [number, number, number]; readonly size: readonly [number, number, number] }

const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function createWeatherState(preset: WeatherPreset, intensity = 1, wind: readonly [number, number, number] = [0, 0, 0]): WeatherState {
  return { preset, intensity: clamp(intensity), wind: [...wind] }
}

export function interpolateWeather(transition: WeatherTransition): WeatherState {
  const t = clamp(transition.progress)
  return {
    preset: t < 0.5 ? transition.from.preset : transition.to.preset,
    intensity: lerp(transition.from.intensity, transition.to.intensity, t),
    wind: [0, 1, 2].map((axis) => lerp(transition.from.wind[axis]!, transition.to.wind[axis]!, t)) as [number, number, number],
  }
}

export function validateArchitecture(modules: readonly ArchitectureModule[]): void {
  const ids = new Set<string>()
  for (const module of modules) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(module.id)) throw new Error(`Invalid architecture module id: ${module.id}`)
    if (ids.has(module.id)) throw new Error(`Duplicate architecture module id: ${module.id}`)
    if (module.size.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error(`Architecture module ${module.id} must have positive size`)
    ids.add(module.id)
  }
}

export function createArchitectureLayout(modules: readonly ArchitectureModule[]): readonly ArchitectureModule[] {
  validateArchitecture(modules)
  return modules.map((module) => ({ ...module, position: [...module.position], size: [...module.size] }))
}
