/**
 * The site's languages. Hebrew lives at the site root (…/capoeira/), English under …/capoeira/en/.
 * Pages that exist in both languages are built twice from one template in src/pages/[...lang]/.
 * Site-wide names and the thanks list are in src/data/site.ts; the About letter is src/content/welcome/<locale>.md.
 */
export const LOCALES = ['he', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'he';

export const LANGUAGES = {
  /** `label` is what the language menu shows; `dir` is the direction of prose (the page layout stays left-to-right). */
  he: { label: 'עברית', dir: 'rtl', ogLocale: 'he_IL' },
  en: { label: 'EN', dir: 'ltr', ogLocale: 'en_US' },
} as const satisfies Record<Locale, { label: string; dir: 'rtl' | 'ltr'; ogLocale: string }>;

/** `getStaticPaths` entries for a `[...lang]` route: Hebrew has no prefix, the others do. */
export function localeParams() {
  return LOCALES.map((locale) => ({ params: { lang: locale === DEFAULT_LOCALE ? undefined : locale }, locale }));
}

/** URL of a page in a language. `path` is relative to the site root, e.g. '', 'about/' or 'songs/marinheiro-so/'. */
export function localePath(locale: Locale, path = ''): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `${locale}/`;
  return `${import.meta.env.BASE_URL}${prefix}${path}`;
}

const he = {
  skipLink: 'דלגו לתוכן',
  nav: { label: 'ראשי', songs: 'שירים', about: 'אודות' },
  language: 'שפה',
  home: {
    title: 'שירים',
    searchLabel: 'חיפוש שירים',
    searchPlaceholder: 'חיפוש',
    filterByTag: 'סינון לפי תגית',
    countOne: 'שיר אחד',
    /** `{n}` is replaced by the number of songs shown. */
    countMany: '{n} שירים',
    noResults: 'לא מצאנו שיר כזה. נסו מילה אחרת או בטלו את הסינון.',
  },
  card: {
    video: '▶ וידאו',
    videoHint: 'יש ביצוע ביוטיוב',
    translation: 'תרגום',
    translationHint: 'יש תרגום לעברית',
  },
  song: {
    aka: 'ידוע גם בשם',
    tags: 'תגיות',
    lyrics: 'מילות השיר',
    translation: 'תרגום',
    translationHint: 'הצגת התרגום לעברית מתחת לכל שורה',
    print: 'הדפסה',
    printHint: 'המילים בלבד, בעמוד A4 אחד',
    notes: 'הערות',
    moreSongs: 'שירים נוספים',
    allSongs: 'כל השירים',
    times: (n: number) => `${n} פעמים`,
    playVideo: 'נגנו את הביצוע ביוטיוב',
  },
  about: {
    title: 'אודות',
    thanks: 'תודה!',
    addSong: '+ הוספת שיר',
  },
};

const en: typeof he = {
  skipLink: 'Skip to content',
  nav: { label: 'Main', songs: 'Songs', about: 'About' },
  language: 'Language',
  home: {
    title: 'Songs',
    searchLabel: 'Search songs',
    searchPlaceholder: 'Search',
    filterByTag: 'Filter by tag',
    countOne: '1 song',
    countMany: '{n} songs',
    noResults: "We couldn't find that song. Try another word, or clear the filter.",
  },
  card: {
    video: '▶ Video',
    videoHint: 'Has a YouTube performance',
    translation: 'Translation',
    translationHint: 'Has an English translation',
  },
  song: {
    aka: 'Also known as',
    tags: 'Tags',
    lyrics: 'Lyrics',
    translation: 'Translation',
    translationHint: 'Show the English translation under each line',
    print: 'Print',
    printHint: 'Lyrics only, on one A4 page',
    notes: 'Notes',
    moreSongs: 'More songs',
    allSongs: 'All songs',
    times: (n: number) => `${n} times`,
    playVideo: 'Play the performance on YouTube',
  },
  about: {
    title: 'About',
    thanks: 'Thank you!',
    addSong: '+ Add a song',
  },
};

export const UI = { he, en } satisfies Record<Locale, typeof he>;
