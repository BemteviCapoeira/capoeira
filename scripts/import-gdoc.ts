/**
 * One-time migration of the original Google Doc songbook into src/content/songs/<slug>/.
 *
 *   npm run import:gdoc -- [exported.html] [--force]
 *
 * Without a path it downloads the Doc's public HTML export. Existing song folders are
 * skipped unless --force is given (the repo is the source of truth after the import,
 * so re-running would clobber hand edits).
 *
 * Doc conventions it understands:
 * - "BENGELA ..." / "SOU BENTO ..." header lines → tag for the songs that follow
 * - "____" lines separate songs; the first text line of a song is its title
 * - lines indented with spaces/nbsp are coro (response) lines → "> "
 * - the "קישור לשיר" line holds the YouTube link
 * - lines starting with "*" are notes; the first image after the title is the cover
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';
import { slugify } from '../src/lib/text.ts';

const DOC_URL =
  'https://docs.google.com/document/d/1N99iadjxh-jgNPRitbA34F_WYBAW4BnQuAJM2_cyg4w/export?format=html';
const OUT_DIR = new URL('../src/content/songs/', import.meta.url);

const SECTIONS: [RegExp, string][] = [
  [/^BENGU?ELA\b/, 'benguela'], // upper-case only: "Benguela me chama…" is a lyric
  [/^S(?:OU|ÃO|AO) BENTO\b/, 'sao-bento'],
];
const SEPARATOR = /^_{5,}$/;
const LINK_LINE = 'קישור לשיר';

/** One visual line of the Doc (paragraphs are split on <br>). */
interface Line {
  raw: string;
  note: boolean;
  images: string[];
  links: string[];
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const source = args.find((a) => !a.startsWith('--'));

const html = source ? await readFile(source, 'utf8') : await (await fetch(DOC_URL)).text();
const root = parse(html.replace(/<br[^>]*>/gi, '\n'));

const lines: Line[] = root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').flatMap((el) => {
  const images = el.querySelectorAll('img').map((img) => img.getAttribute('src') ?? '');
  const links = el.querySelectorAll('a').map((a) => unwrapGoogleLink(a.getAttribute('href') ?? ''));
  const note = el.tagName === 'LI';
  return el.text.split('\n').map((raw, i) => ({ raw, note, images: i === 0 ? images : [], links }));
});

const songs: { tag: string; lines: Line[] }[] = [];
let tag: string | undefined;
for (const line of lines) {
  const text = clean(line.raw);
  const section = SECTIONS.find(([re]) => re.test(text));
  if (section) {
    tag = section[1];
    songs.push({ tag, lines: [] });
  } else if (tag && SEPARATOR.test(text)) {
    songs.push({ tag, lines: [] });
  } else if (tag) {
    songs.at(-1)!.lines.push(line);
  }
}

await mkdir(OUT_DIR, { recursive: true });
for (const song of songs) {
  const start = song.lines.findIndex((l) => clean(l.raw));
  if (start >= 0) await writeSong(song.tag, song.lines.slice(start)); // images before the title are section banners
}

async function writeSong(tag: string, songLines: Line[]) {
  const title = clean(songLines[0].raw);
  const slug = slugify(title);
  const dir = new URL(`${slug}/`, OUT_DIR);
  if (!force && (await exists(dir))) {
    console.log(`skip   ${slug} (exists)`);
    return;
  }

  const lyrics: string[] = [];
  const notes: string[] = [];
  let youtube: string | undefined;
  let cover: string | undefined;

  for (const [i, line] of songLines.entries()) {
    cover ??= line.images.find((src) => src.startsWith('data:image/'));
    if (i === 0) continue;
    const text = clean(line.raw);
    if (text.includes(LINK_LINE)) youtube ??= line.links.map(youtubeId).find(Boolean);
    else if (line.note || text.startsWith('*')) text && notes.push(text.replace(/^\*\s*/, ''));
    else if (!text) lyrics.push('');
    else lyrics.push(/^[\s ]{2,}/.test(line.raw) ? `> ${text}` : text);
  }

  await mkdir(dir, { recursive: true });
  const fm = [`titles: ${JSON.stringify([title])}`, `tags: [${tag}]`];
  if (cover) {
    const [, ext, data] = /^data:image\/(\w+);base64,(.*)$/s.exec(cover)!;
    const file = `cover.${ext === 'jpeg' ? 'jpg' : ext}`;
    await writeFile(new URL(file, dir), Buffer.from(data, 'base64'));
    fm.push(`image: ./${file}`, `imageAlt: ""`);
  }
  if (youtube) fm.push(`youtube: ${youtube}`);
  fm.push('lyrics: |', ...tidy(lyrics).map((l) => (l ? `  ${l}` : '')));

  const body = notes.length ? `\n${notes.join('\n\n')}\n` : '';
  await writeFile(new URL('index.md', dir), `---\n${fm.join('\n')}\n---\n${body}`);
  console.log(`wrote  ${slug}${cover ? ' +cover' : ''}${youtube ? ' +youtube' : ''}${notes.length ? ' +notes' : ''}`);
}

/** Collapse runs of blank lines and drop leading/trailing ones. */
function tidy(lines: string[]): string[] {
  const out = lines.filter((l, i) => l || (i > 0 && lines[i - 1]));
  while (out.length && !out[0]) out.shift();
  while (out.length && !out.at(-1)) out.pop();
  return out;
}

function clean(s: string): string {
  return s.replace(/[\s ﻿]+/g, ' ').trim();
}

function unwrapGoogleLink(href: string): string {
  try {
    const url = new URL(href);
    return url.hostname.endsWith('google.com') && url.pathname === '/url' ? (url.searchParams.get('q') ?? href) : href;
  } catch {
    return href;
  }
}

function youtubeId(href: string): string | undefined {
  try {
    const url = new URL(href);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.hostname.endsWith('youtube.com')) return url.searchParams.get('v') ?? undefined;
  } catch {}
  return undefined;
}

async function exists(path: URL): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}
