# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static Astro site: the Abadá-Capoeira Pardes Hanna songbook (Portuguese lyrics with line-by-line Hebrew and English translations). Deployed to GitHub Pages at `https://bemtevi-roda.github.io/capoeira/` on every push to `main` (`.github/workflows/deploy.yml`). No server, no database: songs are Markdown files in the repo. `README.md` is the contributor guide (written for non-developers) and documents the song format in detail.

## Commands

Requires Node ≥ 22.18 (CI uses 24): tests and scripts run `.ts` files directly via Node's built-in type stripping, so there is no ts-node/tsx.

```sh
npm run dev       # dev server at http://localhost:4321/capoeira/ (note the base path)
npm test          # node --test "src/**/*.test.ts"
npm run check     # astro check (type check, incl. .astro files)
npm run build     # build to dist/ — this is also what validates every song
npm run preview   # serve dist/
node --test src/lib/lyrics.test.ts   # run a single test file
```

CI (`.github/workflows/ci.yml`) runs `npm test`, `npm run check`, `npm run build` on every PR; run all three before considering a change done.

Test files import siblings **with the `.ts` extension** (`from './lyrics.ts'`) because they run under plain Node; code bundled by Vite/Astro imports without extensions.

## Architecture

**Songs are an Astro content collection.** `src/content.config.ts` defines the `songs` collection: one folder per song at `src/content/songs/<slug>/index.md` (folder name = id = URL slug), with optional `cover.jpg` plus `wide.jpg` (4:3) / `tall.jpg` (4:5) crops alongside. All song data lives in YAML frontmatter; the Markdown body is unused (text after the closing `---` breaks the build). The Zod schema is the source of truth for fields — note `creation-time` (ISO datetime with offset) is required, though the README template omits it; it drives the home page's "newest" sort. `tags` must be keys of `TAGS` in `src/data/tags.ts`.

**Lyrics format and alignment** (`src/lib/lyrics.ts`): blank line = stanza break, `> ` prefix = coro line, trailing ` xN` = repeat, `~` in a translation = untranslated line. `hebrew`/`english` must match `lyrics` stanza-for-stanza and line-for-line; `alignmentIssues()` is called from the schema's `superRefine`, so misalignment fails `npm run build` with a message naming the stanza. `parseLyrics()` zips lyrics and a translation into `Stanza[]` for rendering (`components/Lyrics.astro`).

**i18n** (`src/data/i18n.ts`): Hebrew is the default locale at the site root, English under `/en/`. Bilingual pages live in `src/pages/[...lang]/` and are built twice via `localeParams()` in `getStaticPaths`. Always build internal URLs with `localePath(locale, path)` / `songUrl()` (they include `import.meta.env.BASE_URL` = `/capoeira/`); `trailingSlash: 'always'` is set in `astro.config.mjs`. All UI strings are in the `UI` object per locale; site names/credits in `src/data/site.ts`. Page layout is LTR in both languages; only Hebrew prose blocks are `dir="rtl"`.

**Song images** are resolved at render time via `import.meta.glob` in `src/lib/song-images.ts` (`getSongImage(songId, path)`), not via the schema's `image()` helper, so a missing file warns and falls back to the logo (`src/scripts/image-fallback.ts`) instead of failing the build.

**Client-side scripts** (`src/scripts/`) are plain TS modules imported from `<script>` tags in pages:
- `search.ts` — home-page filtering/reordering of server-rendered cards; state is kept in the URL (`?q=`, `?tag=`, `?sort=newest`). Text matching uses `fold()` from `src/lib/text.ts` (accent/case/punctuation-insensitive).
- `likes.ts` + `components/LikeButton.astro` — per-device liked songs (localStorage key `likedSongs`, an array of slugs). Every `[data-like=<slug>]` button stays in sync (same page, other tabs, bfcache). The home page's "Liked" chip filters on it (`?liked=1`); `search.ts` re-filters on `onLikesChange`.
- `print.ts` — binary-searches font size and 1–3 columns so a song's print sheet fits one A4 page without wrapping lines (paired with `styles/print.css`, `components/PrintSheet.astro`).
- **"Add a song" flow** (`src/pages/new-song/`, English only, excluded from the sitemap): a browser-only form that writes to the repo through the GitHub REST API using a user-supplied fine-grained token (`auth.ts` stores it in session/localStorage; `github.ts` is a minimal API client; `connect.ts` verifies it). `new-song.ts` builds the `index.md` with `songMarkdown()` / `updateSongMarkdown()` from `src/lib/song-file.ts`, resizes the image, and opens a PR on branch `add-song/<slug>` or `edit-song/<slug>`. `paste-lyrics.ts` converts pasted rich text (Google Docs bold → `> ` coro lines). If you change the frontmatter format, keep `song-file.ts` (and its tests) in sync with `content.config.ts`.

**Contact page** (`src/pages/[...lang]/contact.astro`, both languages): the site has no backend, so the form POSTs JSON to FormSubmit's AJAX endpoint (`https://formsubmit.co/ajax/<SITE.contactFormTo>`, set in `src/data/site.ts`). FormSubmit only delivers after the recipient clicks the activation email triggered by the first submission; after that `contactFormTo` can be swapped for the alias FormSubmit provides. Validation and the emailed fields live in `src/lib/contact.ts` (tested); `src/scripts/contact.ts` is the DOM glue.

**`scripts/import-gdoc.ts`** was a one-time migration from the original Google Doc. The repo is now the source of truth; don't re-run it with `--force` (it would overwrite edited songs).

`docs/typos-*.csv` list suspected typos in imported lyrics awaiting human review.
