import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(root, 'agent/components.json')
const outputPath = resolve(root, 'llms.txt')
const source = JSON.parse(await readFile(sourcePath, 'utf8'))

const lines = [
  '# Astro Spatial',
  '',
  'AI-native spatial pages for Astro and Three.js.',
  '',
  '## Authoring rules',
  '',
  '- Keep HTML semantic and accessible; use the canvas as progressive enhancement.',
  '- Use stable kebab-case IDs for every scene and node.',
  '- Prefer GLB for imported assets and procedural factories for editable code assets.',
  '- Provide a fallback and respect prefers-reduced-motion.',
  '- Do not add physics, multiplayer, or WebGPU-only behavior to the core without an explicit extension.',
  '',
  '## Components',
  '',
]

for (const component of source.components) {
  lines.push(`### ${component.name} (${component.kind})`, '', component.description, '', 'Props:')
  for (const [name, description] of Object.entries(component.props)) {
    lines.push(`- \`${name}\`: ${description}`)
  }
  lines.push('')
}

const generated = `${lines.join('\n').trimEnd()}\n`
if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '')
  if (current !== generated) {
    console.error('llms.txt is stale; run npm run agent:generate')
    process.exit(1)
  }
  console.log('llms.txt is current')
} else {
  await writeFile(outputPath, generated)
  console.log(`Generated ${outputPath}`)
}
