// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Astro doesn't pass `base` to Vite, so the dev server's "o" shortcut opens the
 * server root (a 404 here) instead of the site. Point it at `base`, unless
 * `server.open` already names a URL.
 * @returns {import('astro').AstroIntegration}
 */
function openAtBase() {
  let base = '/';
  return {
    name: 'open-at-base',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base;
      },
      'astro:server:setup': ({ server }) => {
        const openBrowser = server.openBrowser;
        server.openBrowser = () => {
          const options = server.config.server;
          if (typeof options.open === 'string') return openBrowser();
          const { open } = options;
          options.open = base;
          try {
            openBrowser();
          } finally {
            options.open = open;
          }
        };
      },
    },
  };
}

// GitHub Pages project site: https://bemtevi-roda.github.io/capoeira/
// For a custom domain: set `site` to it, drop `base`, and add public/CNAME.
export default defineConfig({
  site: 'https://bemtevi-roda.github.io',
  base: '/capoeira',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/new-song/'),
      // Hebrew pages have no prefix, English ones are under /en/ (see src/data/i18n.ts)
      i18n: { defaultLocale: 'he', locales: { he: 'he-IL', en: 'en-US' } },
    }),
    openAtBase(),
  ],
});
