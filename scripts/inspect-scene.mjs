import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { analyzeAssets, analyzeScene, formatDiagnostics } from '../packages/devtools/dist/index.js'

function valueAfter(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const scenePath = valueAfter('--scene')
const assetsPath = valueAfter('--assets')
if (!scenePath && !assetsPath) {
  console.error('Usage: npm run spatial:inspect -- --scene path/to/scene.json [--assets path/to/assets.json]')
  process.exit(2)
}

const diagnostics = []
if (scenePath) {
  const scene = JSON.parse(await readFile(resolve(scenePath), 'utf8'))
  diagnostics.push(...analyzeScene(scene))
}
if (assetsPath) {
  const assets = JSON.parse(await readFile(resolve(assetsPath), 'utf8'))
  diagnostics.push(...analyzeAssets(assets.assets ?? assets, {
    maxAssets: 12,
    maxTriangleBudget: 300_000,
    maxTextureBudgetBytes: 8 * 1024 * 1024,
  }))
}

console.log(formatDiagnostics(diagnostics))
if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) process.exitCode = 1
