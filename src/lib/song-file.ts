/** Helpers for creating a song's index.md from form input (used by the "Add a song" page). */

export interface SongInput {
  titles: string[];
  tags: string[];
  /** File name of the cover next to index.md, e.g. "cover.jpg". */
  image?: string;
  imageAlt?: string;
  youtube?: { id: string; start?: number };
  lyrics: string;
  translation?: string;
  notes?: string;
}

const YOUTUBE_ID = /^[\w-]{11}$/;

/** Accepts a bare id or any common YouTube URL; also picks up a start time (?t=90, ?t=1m30s, ?start=90). */
export function parseYouTube(input: string): { id: string; start?: number } | undefined {
  const text = input.trim();
  if (YOUTUBE_ID.test(text)) return { id: text };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return undefined;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] ?? null;
  }
  if (!id || !YOUTUBE_ID.test(id)) return undefined;
  const start = parseTime(url.searchParams.get('t') ?? url.searchParams.get('start'));
  return start ? { id, start } : { id };
}

function parseTime(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+s?$/.test(value)) return Number.parseInt(value, 10) || undefined;
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!m) return undefined;
  const seconds = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return seconds || undefined;
}

/**
 * Tidy pasted lyrics: trim lines, collapse repeated spaces and blank lines, and turn lines
 * indented by 2+ spaces (how the original Google Doc marked coro lines) into "> " lines.
 */
export function normalizeLyrics(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((raw) => {
      const line = raw.replace(/ /g, ' ').trimEnd();
      const body = line.trim().replace(/ {2,}/g, ' ');
      if (!body) return '';
      return /^[ \t]{2,}/.test(line) && !body.startsWith('>') ? `> ${body}` : body;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function block(text: string): string[] {
  return text.split('\n').map((line) => (line ? `  ${line}` : ''));
}

/** The full index.md (frontmatter + notes). Strings are JSON-quoted, which is valid YAML. */
export function songMarkdown(song: SongInput): string {
  const lines = [
    '---',
    `titles: ${JSON.stringify(song.titles)}`,
    `tags: [${song.tags.join(', ')}]`,
  ];
  if (song.image) {
    lines.push(`image: ./${song.image}`, `imageAlt: ${JSON.stringify(song.imageAlt ?? '')}`);
  }
  if (song.youtube) {
    lines.push(`youtube: ${song.youtube.id}`);
    if (song.youtube.start) lines.push(`youtubeStart: ${song.youtube.start}`);
  }
  lines.push('lyrics: |', ...block(normalizeLyrics(song.lyrics)));
  const translation = song.translation ? normalizeLyrics(song.translation) : '';
  if (translation) lines.push('translation: |', ...block(translation));
  lines.push('---');
  const notes = song.notes?.trim();
  return `${lines.join('\n')}\n${notes ? `\n${notes}\n` : ''}`;
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
