import type { ImageMetadata } from 'astro';

const songImages = import.meta.glob<ImageMetadata>('/src/content/songs/**/*.{avif,gif,jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
});

const warnedMissingImages = new Set<string>();

export function getSongImage(songId: string, path?: string): ImageMetadata | undefined {
  if (!path) return undefined;

  const imagePath = path.replace(/\\/g, '/').replace(/^\.\//, '');
  const key = `/src/content/songs/${songId}/${imagePath}`;
  const image = songImages[key];

  if (!image && !warnedMissingImages.has(key)) {
    warnedMissingImages.add(key);
    console.warn(`Missing song image: ${songId}/${path}`);
  }

  return image;
}
