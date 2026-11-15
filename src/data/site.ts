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
    description: 'שירי קפואירה בפורטוגזית, עם תרגום לעברית, ביצועים מיוטיוב ודף להדפסה.',
    club: 'מועדון פרדס חנה, פרופסורה ארפה',
    group: "קבוצת יום ד' בהדרכת גרדואדה קיטוצ'י",
    thanksIntro: 'ראשית תודה לכל מי שלימד אותנו לשיר ולנגן:',
    thanks: ['ארפה', 'גרוזליה', 'פולנטה', 'פימנטה', 'שאמה', "מאמוצ'י"],
    credit: 'עריכה: איתן Bemtevi',
    /** Printed at the bottom of every song sheet. */
    createdBy: 'נוצר על ידי איתן Bemtevi',
  },
  en: {
    title: 'Abadá Capoeira Songbook',
    shortTitle: 'Capoeira Songs',
    description: 'Capoeira songs in Portuguese, with English translations, YouTube performances and printable lyrics.',
    club: 'Pardes Hanna club, Professora Harpa',
    group: 'Wednesday group, led by Graduada Quitute',
    thanksIntro: 'First of all, thank you to everyone who taught us to sing and play:',
    thanks: ['Harpa', 'Groselha', 'Polenta', 'Pimenta', 'Chama', 'Mamute'],
    credit: 'Edited by Eitan Bemtevi',
    createdBy: 'Created by Eitan Bemtevi',
  },
} satisfies Record<Locale, Record<string, string | string[]>>;

/** The site's address without "https://", e.g. for the print footer. */
export function siteAddress(): string {
  return new URL(import.meta.env.BASE_URL, import.meta.env.SITE).href.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
