# שירי קפואירה · Capoeira songbook

The Abadá-Capoeira Pardes Hanna songbook: Portuguese lyrics with a line-by-line Hebrew translation, a YouTube recording, notes, and a one-page A4 print version of every song.

Static site built with [Astro](https://astro.build) and deployed to GitHub Pages by GitHub Actions on every push to `main`.

## Development

Requires Node 22.18+ (Node 24 recommended).

```sh
npm install
npm run dev       # http://localhost:4321/capoeira/
npm test          # unit tests (lyrics parser, search folding)
npm run check     # type-check
npm run build     # production build into dist/ (also validates every song)
```

## Adding a song

Create a folder under `src/content/songs/` whose name is the URL slug (lowercase, no accents, dashes), containing an `index.md` and, optionally, a cover image:

```
src/content/songs/eu-tava-la-na-bahia/
├── index.md
└── cover.jpg
```

```yaml
---
titles: ["Eu tava lá na Bahia", "Another name"]   # first = main title; all are searchable
tags: [sao-bento]                                  # must exist in src/data/tags.ts
image: ./cover.jpg                                 # optional
imageAlt: "תיאור קצר של התמונה"                     # describe the image (Hebrew)
youtube: msmBZpgMhBk                               # optional: the 11-character video id
youtubeStart: 30                                   # optional: start at second 30
lyrics: |
  Eu tava lá na Bahia
  > Eh Bahia
  Berimbau por que me chama x2

  O menino vem aprender a jogar
  > Capoeira
translation: |                                     # optional
  הייתי שם בבאהיה
  > אה, באהיה
  ברימבאו, למה אתה קורא לי

  הילד בא ללמוד לשחק
  > קפואירה
---
Notes about the song (Markdown, Hebrew). Shown in the "הערות" box.
```

Lyrics format:

| Write | Meaning |
| --- | --- |
| one line of text | one sung line |
| empty line | new stanza |
| `> ` at the start | coro (response) line, shown indented and coloured |
| ` x2` at the end | repeat badge (any number) |
| `~` as a translation line | that line has no translation |

The translation must match the lyrics **line for line**: the same number of stanzas, and the same number of lines in each stanza. If it doesn't, the build fails and names the stanza that's off. On the site, hovering a line shows its translation (tap on phones), and a switch shows all of them.

### Tags

Tags are defined once in [`src/data/tags.ts`](src/data/tags.ts) with their label and colour (a palette name from [`src/styles/tokens.css`](src/styles/tokens.css)). Add a new tag there before using it in a song.

### Home page text

The welcome letter is [`src/content/home.md`](src/content/home.md); the title, club, thanks list and credits are in [`src/data/site.ts`](src/data/site.ts).

## Printing

The print button on each song page (or Ctrl/Cmd+P) prints only the title and Portuguese lyrics. The text size and column count are fitted automatically so every song fits one A4 page. Choose "Save as PDF" in the print dialog to get a file.

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. One-time setup, done by a repository admin:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. The site is served at `https://bemtevicapoeira.github.io/capoeira/`. `base` in [`astro.config.mjs`](astro.config.mjs) must match the repository name. For a custom domain, set `site` to it, remove `base`, and add `public/CNAME`.

`.github/workflows/ci.yml` runs the tests, type-check and build on every pull request.

## Origin

The first 13 songs were imported from the group's original Google Doc with `npm run import:gdoc` ([`scripts/import-gdoc.ts`](scripts/import-gdoc.ts)). The repository is now the source of truth; the script refuses to overwrite existing songs without `--force`.
