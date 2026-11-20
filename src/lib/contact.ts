/** The Contact page's form: what it asks for, how it's checked, and what is emailed (via FormSubmit). */
import { TAGS, type TagId } from '../data/tags.ts';
import { parseYouTube } from './song-file.ts';

export const TOPICS = ['new-song', 'song-comment', 'general'] as const;
export type Topic = (typeof TOPICS)[number];

export interface ContactInput {
  name: string;
  /** Capoeira nickname (apelido). */
  nickname: string;
  email: string;
  phone: string;
  topic: Topic | '';
  /** new-song: the suggested song's name, an optional YouTube link and optional tags (as in the admin form). */
  songName: string;
  youtube: string;
  tags: TagId[];
  /** song-comment: the slug of the song the comment is about. */
  song: string;
  /** The comment. Required for every topic. */
  message: string;
}

export type ContactField = keyof ContactInput;
export type ContactError = 'required' | 'email' | 'phone' | 'youtube';

const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function isValidEmail(text: string): boolean {
  return EMAIL.test(text.trim());
}

/** Lenient: digits with optional +, spaces, dashes, dots and parentheses; 7–15 digits in all. */
export function isValidPhone(text: string): boolean {
  const t = text.trim();
  if (!/^\+?[\d\s().-]+$/.test(t)) return false;
  const digits = t.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

/** Problems with the form, by field. Empty when it can be sent. */
export function validateContact(input: ContactInput): Partial<Record<ContactField, ContactError>> {
  const errors: Partial<Record<ContactField, ContactError>> = {};
  const blank = (field: Exclude<ContactField, 'tags'>) => !input[field].trim();

  if (blank('name')) errors.name = 'required';
  if (blank('email')) errors.email = 'required';
  else if (!isValidEmail(input.email)) errors.email = 'email';
  if (!blank('phone') && !isValidPhone(input.phone)) errors.phone = 'phone';

  switch (input.topic) {
    case 'new-song':
      if (blank('songName')) errors.songName = 'required';
      if (!blank('youtube') && !parseYouTube(input.youtube)) errors.youtube = 'youtube';
      break;
    case 'song-comment':
      if (blank('song')) errors.song = 'required';
      break;
    case 'general':
      break;
    default:
      errors.topic = 'required';
  }
  if (input.topic && blank('message')) errors.message = 'required';
  return errors;
}

const TOPIC_NAMES: Record<Topic, string> = {
  'new-song': 'Add a song',
  'song-comment': 'Comment on a song',
  general: 'General comment',
};

/**
 * The fields FormSubmit emails, in order. Only the ones that apply to the chosen topic are included.
 * `email` is also FormSubmit's reply-to address, so the recipient can just press Reply.
 */
export function contactPayload(
  input: ContactInput,
  context: { song?: { title: string; url: string }; language: string },
): Record<string, string> {
  const topic = input.topic as Topic;
  const sender = input.nickname.trim() ? `${input.name.trim()} (${input.nickname.trim()})` : input.name.trim();
  const subjectDetail =
    topic === 'new-song' ? `: ${input.songName.trim()}` : topic === 'song-comment' && context.song ? `: ${context.song.title}` : '';

  const fields: Record<string, string | undefined> = {
    _subject: `Capoeira songbook – ${TOPIC_NAMES[topic]}${subjectDetail} – from ${sender}`,
    _template: 'table',
    Topic: TOPIC_NAMES[topic],
    Name: input.name.trim(),
    Nickname: input.nickname.trim(),
    email: input.email.trim(),
    Phone: input.phone.trim(),
    'Song name': topic === 'new-song' ? input.songName.trim() : undefined,
    'YouTube link': topic === 'new-song' ? input.youtube.trim() : undefined,
    Tags: topic === 'new-song' ? input.tags.map((tag) => TAGS[tag].label).join(', ') : undefined,
    Song: topic === 'song-comment' ? context.song?.title : undefined,
    'Song page': topic === 'song-comment' ? context.song?.url : undefined,
    Message: input.message.trim(),
    'Site language': context.language,
  };
  return Object.fromEntries(Object.entries(fields).filter((entry): entry is [string, string] => !!entry[1]));
}
