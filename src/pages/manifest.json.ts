import type { APIRoute } from 'astro';
import { SITE_TEXT } from '../data/site';

// Web app manifest, generated so every URL follows the configured `base`.
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL;
  const site = SITE_TEXT.he; // English visitors are sent to /en/ by the language preference in Base.astro
  const manifest = {
    id: base,
    name: site.title,
    short_name: site.shortTitle,
    description: site.description,
    lang: 'he',
    start_url: base,
    scope: base,
    display: 'standalone',
    theme_color: '#ffcf33',
    background_color: '#fff6e3',
    icons: [
      { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: `${base}favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
