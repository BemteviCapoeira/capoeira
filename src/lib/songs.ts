import type { CollectionEntry } from 'astro:content';

export type Song = CollectionEntry<'songs'>;

/** Card/header colours, rotated through the alphabetical song list so neighbours differ. */
const ACCENTS = ['coral', 'turquoise', 'yellow', 'pink', 'lime', 'orange', 'sky'] as const;

export function accent(index: number): string {
  return `var(--${ACCENTS[index % ACCENTS.length]})`;
}

export function sortSongs(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => a.data.titles[0].localeCompare(b.data.titles[0], 'pt', { sensitivity: 'base' }));
}

export function songUrl(song: Song): string {
  return `${import.meta.env.BASE_URL}songs/${song.id}/`;
}

export function tagUrl(tag: string): string {
  return `${import.meta.env.BASE_URL}?tag=${encodeURIComponent(tag)}#songs`;
}
