/**
 * Lyrics format (both `lyrics` and `translation` frontmatter fields):
 * - one sung line per text line; a blank line starts a new stanza
 * - `> ` at the start of a line marks a coro (chorus response) line
 * - a trailing ` x2` (any number) marks a repeated line
 * - in `translation`, a line that is just `~` means "no translation for this line"
 *
 * The translation must have exactly the same stanzas and line counts as the lyrics.
 */

export interface Line {
  pt: string;
  he?: string;
  coro: boolean;
  repeat?: number;
}

export type Stanza = Line[];

interface RawLine {
  text: string;
  coro: boolean;
  repeat?: number;
}

const CORO = /^>\s?/;
const REPEAT = /\s+x(\d+)$/i;
const NO_TRANSLATION = '~';

function parseLine(raw: string): RawLine {
  let text = raw.trim();
  const coro = CORO.test(text);
  if (coro) text = text.replace(CORO, '').trim();
  const m = REPEAT.exec(text);
  if (m) text = text.slice(0, m.index).trimEnd();
  return { text, coro, repeat: m ? Number(m[1]) : undefined };
}

function splitStanzas(src: string): RawLine[][] {
  const stanzas: RawLine[][] = [];
  let current: RawLine[] = [];
  for (const raw of src.replace(/\r\n?/g, '\n').split('\n')) {
    if (raw.trim() === '') {
      if (current.length) stanzas.push(current);
      current = [];
    } else {
      current.push(parseLine(raw));
    }
  }
  if (current.length) stanzas.push(current);
  return stanzas;
}

/** Human-readable problems that make the translation not line up with the lyrics (empty = aligned). */
export function alignmentIssues(lyrics: string, translation?: string): string[] {
  if (!translation?.trim()) return [];
  const pt = splitStanzas(lyrics);
  const he = splitStanzas(translation);
  const issues: string[] = [];
  if (pt.length !== he.length) {
    issues.push(`translation has ${he.length} stanzas but lyrics have ${pt.length}`);
  }
  for (let i = 0; i < Math.min(pt.length, he.length); i++) {
    if (pt[i].length !== he[i].length) {
      issues.push(
        `stanza ${i + 1} ("${pt[i][0].text}"): lyrics have ${pt[i].length} lines but translation has ${he[i].length}`,
      );
    }
  }
  return issues;
}

export function parseLyrics(lyrics: string, translation?: string): Stanza[] {
  const pt = splitStanzas(lyrics);
  const he = translation?.trim() ? splitStanzas(translation) : [];
  return pt.map((stanza, i) =>
    stanza.map((line, j) => {
      const tr = he[i]?.[j]?.text;
      return { pt: line.text, coro: line.coro, repeat: line.repeat, he: tr && tr !== NO_TRANSLATION ? tr : undefined };
    }),
  );
}

export function hasTranslation(stanzas: Stanza[]): boolean {
  return stanzas.some((s) => s.some((l) => l.he));
}

export function firstLine(lyrics: string): string {
  return splitStanzas(lyrics)[0]?.[0]?.text ?? '';
}
