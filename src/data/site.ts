import type { Locale } from './i18n';

export const SITE = {
  /** The group's cheer (the same in every language). */
  cheer: 'VIVA QUARTA-FEIRA!!!',
  /** The GitHub repository the "Add a song" form opens pull requests against. */
  repo: { owner: 'bemtevi-roda', name: 'capoeira' },
};

/** Site-wide names and texts, per language (shown in the header, the About page, the print footer and link previews). */
export const SITE_TEXT = {
  he: {
    title: 'קובץ שירי קפואירה אבאדה',
    shortTitle: 'שירי קפואירה',
    description: 'שירי קפואירה בפורטוגזית, עם תרגום לעברית ואנגלית, ביצועים מיוטיוב ודף להדפסה.',
    club: 'מועדון פרדס חנה, פרופסורה ארפה',
    group: "קבוצת יום ד' בהדרכת גרדואדה קיטוצ'י",
    thanksIntro: 'תודה לכל מי שלימד אותנו לשיר ולנגן:',
    thanks: ['ארפה', 'גרוזליה', 'פולנטה', 'פימנטה', 'שאמה', "מאמוצ'י"],
    siteThanksIntro: 'תודה ל',
    siteThanks: ['שחר לינסי'],
    siteThanksOutro: 'שעזר בבניית האתר',
    credit: 'נוצר על ידי:',
    /** Printed at the bottom of every song sheet. */
    createdBy: 'נוצר על ידי Bemtevi',
    
  },
  en: {
    title: 'Abadá Capoeira Songbook',
    shortTitle: 'Capoeira Songs',
    description: 'Capoeira songs in Portuguese, with English and Hebrew translations, YouTube performances and printable lyrics page.',
    club: 'Pardes Hanna club, Professora Harpa',
    group: 'Wednesday group, led by Graduada Quitute',
    thanksIntro: 'Thanks to everyone who taught us to sing and play:',
    thanks: ['Arpa', 'Groselha', 'Polenta', 'Pimenta', 'Chama', 'Mamute'],
    siteThanksIntro: 'Thanks to',
    siteThanks: ['Shachar Lince'],
    siteThanksOutro: 'for helping build this site',
    credit: 'Created by:',
    createdBy: 'Created by: Bemtevi',
  },
} satisfies Record<Locale, Record<string, string | string[]>>;

/** The site's address without "https://", e.g. for the print footer. */
export function siteAddress(): string {
  return new URL(import.meta.env.BASE_URL, import.meta.env.SITE).href.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
