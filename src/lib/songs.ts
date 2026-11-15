import type { CollectionEntry } from 'astro:content';
import { localePath, type Locale } from '../data/i18n';

export type Song = CollectionEntry<'songs'>;

/** Song-page header colours, rotated through the alphabetical song list so neighbours differ. */
const ACCENTS = ['coral', 'turquoise', 'yellow', 'pink', 'lime', 'orange', 'sky'] as const;

export function accent(index: number): string {
  return `var(--${ACCENTS[index % ACCENTS.length]})`;
}

export function sortSongs(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => a.data.titles[0].localeCompare(b.data.titles[0], 'pt', { sensitivity: 'base' }));
}

export function songUrl(song: Song, locale: Locale): string {
  return localePath(locale, `songs/${song.id}/`);
}

export function tagUrl(tag: string, locale: Locale): string {
  return `${localePath(locale)}?tag=${encodeURIComponent(tag)}#songs`;
}

/** The song's line-for-line translation into the page's language, if it has one. */
export function translationOf(song: Song, locale: Locale): string | undefined {
  const text = locale === 'he' ? song.data.hebrew : song.data.english;
  return text?.trim() ? text : undefined;
}
