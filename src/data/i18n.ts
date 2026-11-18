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
    whatsNew: 'מה חדש',
    sortByCreationTime: 'מיון שירים לפי זמן',
    filterTagHints: {
      benguela: 'הצג רק שירי בנגלה',
      'sao-bento': 'הצג רק שירי סאו בנטו',
    },
    countOne: 'שיר אחד',
    /** `{n}` is replaced by the number of songs shown. */
    countMany: '{n} שירים',
    noResults: 'לא מצאנו שיר כזה. נסו מילה אחרת או בטלו את הסינון.',
    keepPlaying: 'איזה שיר נשיר עכשיו?',
    backToTop: 'חזרה לראש הרשימה',
    installApp: 'איך להתקין את האפליקציה',
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
    adminTitle: 'לדף ניהול',
    adminDescription: 'הוספת שירים ועריכת תוכן האתר',
    installApp: 'איך להתקין את האפליקציה',
    backToSongs: 'חזרה לשירים',
  },
  install: {
    title: 'התקנת אפליקציית ספר השירים',
    intro: 'אפשר להוסיף את ספר השירים למסך הבית ולהשתמש בו כאפליקציה.',
    androidTitle: 'Android',
    androidSteps: [
      'פתחו את האתר בדפדפן Chrome.',
      'פתחו את התפריט (⋮).',
      'גללו מטה בתפריט ובחרו "התקנה ויצירת קיצור דרך".',
      'בחרו "אפליקציה" (ולא "יצירת קיצור דרך"), ואז לחצו על "התקנה" כדי להשלים.',
    ],
    androidMenuOption: 'התקנה ויצירת קיצור דרך',
    iosTitle: 'iPhone או iPad',
    iosSteps: [
      'פתחו את האתר בדפדפן Safari.',
      'לחצו על כפתור השיתוף (ריבוע עם חץ כלפי מעלה).',
      'גללו מטה ובחרו "הוספה למסך הבית".',
      'לחצו על "התקנה".',
    ],
    iosMenuOption: 'הוספה למסך הבית',
    shareTitle: 'שיתוף',
    tipTitle: 'לא מופיעה אפשרות התקנה?',
    tip: 'ודאו שאתם משתמשים ב-Safari באייפון או ב-Chrome באנדרואיד. שמות האפשרויות עשויים להשתנות מעט בין מכשירים.',
    appInstalled: 'מזל טוב! האפליקציה הותקנה. חפשו במסך הבית את האייקון הצהוב עם הברימבאו.',
    backToAbout: 'חזרה לעמוד אודות',
    backToSongs: 'חזרה לשירים',
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
    whatsNew: "What's new",
    sortByCreationTime: 'Sort songs by time',
    filterTagHints: {
      benguela: 'Show only Benguela songs',
      'sao-bento': 'Show only São Bento songs',
    },
    countOne: '1 song',
    countMany: '{n} songs',
    noResults: "We couldn't find that song. Try another word, or clear the filter.",
    keepPlaying: 'Which song shall we sing next?',
    backToTop: 'Back to top',
    installApp: 'How to install the app',
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
    adminTitle: 'Administration',
    adminDescription: 'Add songs and edit site content',
    installApp: 'How to install the app',
    backToSongs: 'Back to Songs',
  },
  install: {
    title: 'Install the songbook app',
    intro: 'Add the songbook to your phone’s home screen for quick, app-like access.',
    androidTitle: 'Android',
    androidSteps: [
      'Open this page in Chrome.',
      'Tap the menu (⋮).',
      'Scroll down the menu and tap “Install and create shortcut.”',
      'Choose “App” (not “Create shortcut”), then tap “Install” to finish.',
    ],
    androidMenuOption: 'Install and create shortcut',
    iosTitle: 'iPhone or iPad',
    iosSteps: [
      'Open this page in Safari.',
      'Tap the Share button (the square with an arrow pointing up).',
      'Scroll down and tap “Add to Home Screen.”',
      'Tap “Add.”',
    ],
    iosMenuOption: 'Add to Home Screen',
    shareTitle: 'Share',
    tipTitle: 'Don’t see an install option?',
    tip: 'Make sure you’re using Safari on iPhone or Chrome on Android. Menu labels may vary slightly by device.',
    appInstalled: 'Congratulations! The app is installed. Look for the yellow berimbau icon on your home screen.',
    backToAbout: 'Back to About',
    backToSongs: 'Back to Songs',
  },
};

export const UI = { he, en } satisfies Record<Locale, typeof he>;
