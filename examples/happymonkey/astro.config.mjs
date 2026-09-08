import { defineConfig } from 'astro/config'
import { astroSpatial } from '@astro-spatial/astro'

export default defineConfig({
  integrations: [astroSpatial()],
})
