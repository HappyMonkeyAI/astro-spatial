import assert from 'node:assert/strict'
import test from 'node:test'
import { createArchitectureLayout, createWeatherState, interpolateWeather } from '../dist/index.js'

test('weather transitions interpolate intensity and wind deterministically', () => {
  const clear = createWeatherState('clear', 0, [0, 0, 0]); const rain = createWeatherState('rain', 1, [2, 0, -2])
  assert.deepEqual(interpolateWeather({ from: clear, to: rain, progress: 0.5 }), { preset: 'rain', intensity: 0.5, wind: [1, 0, -1] })
})

test('architecture layouts validate stable ids and dimensions', () => {
  const layout = createArchitectureLayout([{ id: 'main-room', type: 'room', position: [0, 0, 0], size: [4, 3, 4] }])
  assert.deepEqual(layout[0].size, [4, 3, 4])
  assert.throws(() => createArchitectureLayout([{ id: 'bad id', type: 'wall', position: [0, 0, 0], size: [1, 1, 1] }]))
})
