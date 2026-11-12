// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site: https://bemtevicapoeira.github.io/capoeira/
// For a custom domain: set `site` to it, drop `base`, and add public/CNAME.
export default defineConfig({
  site: 'https://bemtevicapoeira.github.io',
  base: '/capoeira',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
