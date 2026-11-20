import type { Locale } from './i18n';

export const SITE = {
  /** The group's cheer (the same in every language). */
  cheer: 'VIVA QUARTA-FEIRA!!!',
  /** The GitHub repository the "Add a song" form opens pull requests against. */
  repo: { owner: 'bemtevi-roda', name: 'capoeira' },
  /**
   * Where the Contact form is emailed, through FormSubmit (formsubmit.co). The first message sent asks this address
   * to activate the form (one click in that email); messages arrive only after that. Once activated, FormSubmit's
   * email shows a random alias: put it here instead of the address to keep the address out of the page source.
   */
  contactFormTo: '6566fb98f15f9b02ff4a43c4d17cf490',
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
    siteThanks: ['לינסי', 'פנדלו'],
    siteThanksJoiner: ' ו-',
    siteThanksOutro: 'שעזרו בבנייה ותחזוקה של האתר',
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
    siteThanks: ['Lince', 'Pendelo'],
    siteThanksJoiner: ' and ',
    siteThanksOutro: 'for helping build and maintain the site',
    credit: 'Created by:',
    createdBy: 'Created by: Bemtevi',
  },
} satisfies Record<Locale, Record<string, string | string[]>>;

/** The site's address without "https://", e.g. for the print footer. */
export function siteAddress(): string {
  return new URL(import.meta.env.BASE_URL, import.meta.env.SITE).href.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
