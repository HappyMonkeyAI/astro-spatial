import type { AstroIntegration } from 'astro'

export interface AstroSpatialOptions {
  readonly maxDpr?: number
  readonly enableWebGL?: boolean
}

/** Minimal integration boundary; scene components are added in the next slice. */
export function astroSpatial(_options: AstroSpatialOptions = {}): AstroIntegration {
  return {
    name: '@astro-spatial/astro',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript('page', `document.documentElement.dataset.astroSpatial = 'ready'`)
      },
    },
  }
}
