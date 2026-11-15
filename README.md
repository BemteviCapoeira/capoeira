# Capoeira Songbook

The Abadá-Capoeira Pardes Hanna songbook website, in Hebrew and English: every song has its Portuguese lyrics, line-by-line Hebrew and English translations (hover or tap a line), a YouTube recording, notes, and a print button that fits the lyrics onto one A4 page.

**Live site:** https://bemtevi-roda.github.io/capoeira/

The site is built with [Astro](https://astro.build). Every change that reaches the `main` branch is published automatically by GitHub Actions; there is no server to manage.

---

## Contents

1. [What's where](#1-whats-where)
2. [Set up your computer (one time)](#2-set-up-your-computer-one-time)
3. [Run the site on your computer](#3-run-the-site-on-your-computer)
4. [Add a new song](#4-add-a-new-song)
5. [Add or fix a Hebrew translation](#5-add-or-fix-a-hebrew-translation)
6. [Other common edits](#6-other-common-edits)
7. [Check your changes before publishing](#7-check-your-changes-before-publishing)
8. [Publish (deploy)](#8-publish-deploy)
9. [Editing without installing anything (GitHub website)](#9-editing-without-installing-anything-github-website)
10. [Troubleshooting](#10-troubleshooting)
11. [Reference](#11-reference)

---

## 1. What's where

| Path                                 | What it is                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| `src/content/songs/<slug>/index.md`  | One folder per song: lyrics, translation, tags, video, notes |
| `src/content/songs/<slug>/cover.jpg` | The song's picture (optional)                                |
| `src/content/welcome/he.md`, `en.md` | The welcome letter on the About page, in each language       |
| `src/data/site.ts`                   | Site title, club and group names, thanks list, credits       |
| `src/data/i18n.ts`                   | The languages, and all button/label text in each language    |
| `src/pages/[...lang]/`               | Pages built in both languages (home, About, song pages)      |
| `src/data/tags.ts`                   | The list of allowed tags (Benguela, São Bento, …)            |
| `src/styles/tokens.css`              | Colours and fonts                                            |
| `.github/workflows/deploy.yml`       | Publishes the site when `main` changes                       |
| `.github/workflows/ci.yml`           | Checks every pull request                                    |
| `docs/typos-*.csv`                   | Suspected typos in the imported lyrics, waiting for review   |

The folder name of a song (`<slug>`) is its web address: `src/content/songs/marinheiro-so/` becomes `…/capoeira/songs/marinheiro-so/` in Hebrew and `…/capoeira/en/songs/marinheiro-so/` in English.

**Languages:** Hebrew pages are at the site root, English pages under `/en/`. The language menu in the header switches between them and remembers the choice: opening the site later (a bookmark, the home-screen app, a shared link) lands in that language. The page layout is left-to-right in both languages; Hebrew text blocks are right-to-left inside their boxes. The "Add a song" pages are in English only.

---

## 2. Set up your computer (one time)

You need:

- **Git** — check with `git --version`.
- **Node.js 22.18 or newer** (24 recommended) — check with `node --version`. Download it from [nodejs.org](https://nodejs.org/) if needed.
- **Write access** to the [bemtevi-roda/capoeira](https://github.com/bemtevi-roda/capoeira) repository on GitHub.

Then:

1. Get the code:

   ```sh
   git clone https://github.com/bemtevi-roda/capoeira.git
   cd capoeira
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

---

## 3. Run the site on your computer

1. Start the development server:

   ```sh
   npm run dev
   ```

2. Open **http://localhost:4321/capoeira/** in your browser.
3. Edit any file. The page reloads by itself when you save.
4. Stop the server with `Ctrl + C`.

---

## 4. Add a new song

1. **Create a branch** for your change:

   ```sh
   git checkout main
   git pull
   git checkout -b add-song-paranaue
   ```

2. **Create the song folder.** Pick a slug: lowercase, no accents, words separated by dashes (e.g. `paranaue`, `sao-bento-me-chama`).

   ```sh
   mkdir src/content/songs/paranaue
   ```

3. **Create `index.md`** in that folder. Copy this template and fill it in:

   ```yaml
   ---
   titles: ["Paranauê", "Paraná ê"] # first = main title; the others are alternative names
   tags: [sao-bento] # must exist in src/data/tags.ts
   image: ./cover.jpg # optional — delete this line if there's no picture
   imageAlt: "תיאור קצר של התמונה" # describe the picture in Hebrew (or delete with `image`)
   imageAltEn: "A short description of the picture" # …and in English
   youtube: AbCdEfGhIjK # optional — the 11-character video id
   youtubeStart: 30 # optional — start the video at second 30
   lyrics: |
     First line of the song
     > A coro (response) line
     A repeated line x2

     First line of the second stanza
   hebrew: |
     השורה הראשונה של השיר
     > שורת מקהלה
     שורה שחוזרת

     השורה הראשונה של הבית השני
   english: |
     The first line of the song
     > A coro line
     A repeated line

     The first line of the second stanza
   notesEn: |
     Optional notes about the song, in English. They appear in the "Notes" box.
   ---
   Optional notes about the song, in Hebrew. They appear in the "הערות" box.
   ```

   - **Video id:** in `https://youtu.be/AbCdEfGhIjK` or `https://www.youtube.com/watch?v=AbCdEfGhIjK`, the id is `AbCdEfGhIjK`.
   - **Indentation matters:** every lyric and translation line starts with exactly two spaces, as above.
   - The rules for the lyrics are in [the lyrics format](#lyrics-format).

4. **Add a picture (optional).** Put a JPG or PNG named `cover.jpg` (or `cover.png`, and update the `image:` line) in the same folder. Any size is fine; the site resizes it.

5. **Preview it** with `npm run dev` (see [step 3](#3-run-the-site-on-your-computer)). The song appears on the home page in alphabetical order.

6. **Check and publish** — see [step 7](#7-check-your-changes-before-publishing) and [step 8](#8-publish-deploy).

---

## 5. Add or fix a translation

The translations live in the song's `index.md`, right under `lyrics:`: `hebrew:` for Hebrew and `english:` for English. The Hebrew pages show the Hebrew one, the English pages the English one.

**The one rule:** a translation must match the lyrics **line for line** — the same number of stanzas, and the same number of lines in each stanza. Line 3 of the translation is shown when someone hovers line 3 of the lyrics.

1. Open `src/content/songs/<slug>/index.md`.
2. Write one translated line for each Portuguese line, and leave an empty line wherever the lyrics have one.
3. For a line that shouldn't be translated (sounds like "Digue, digue, dom"), write just `~`.
4. `>` (coro) and `x2` markers are optional in the translation; they're taken from the lyrics.
5. Run `npm run build`. If the lines don't match, it stops and tells you which stanza is off, for example:

   ```
   english: stanza 3 ("Toque pra três berimbaus"): lyrics have 4 lines but translation has 3
   ```

If a song has no translation in a language, its page in that language simply shows the lyrics without the translation switch.

---

## 6. Other common edits

**Fix a word in the lyrics** — edit the line under `lyrics:` in the song's `index.md`. If the song has a translation, keep the same number of lines.

**Rename a song** — change the first entry of `titles:`. To change its web address too, rename the folder (old links to it will stop working).

**Remove a song** — delete its folder.

**Add a tag**

1. Open `src/data/tags.ts`.
2. Add a line inside `TAGS`, e.g. `angola: { label: 'Angola', color: 'pink' },`. The key (`angola`) is what songs use in `tags:`; `label` is what visitors see; `color` is one of `coral`, `turquoise`, `yellow`, `pink`, `lime`, `orange`, `sky`, `green`, `blue`.
3. Use it in songs: `tags: [angola]`. The home page gets a filter button for it automatically.

**Edit the About page** — the welcome letter is `src/content/welcome/he.md` (Hebrew) and `src/content/welcome/en.md` (English); the title, club, group, thanks names and credits are in `src/data/site.ts`, in both languages. `createdBy` there is the credit printed at the bottom of every song sheet.

**Change a button or label** — all interface text is in `src/data/i18n.ts`, once per language.

**Change colours or fonts** — `src/styles/tokens.css`.

---

## 7. Check your changes before publishing

Run these three commands. All must succeed.

```sh
npm test         # unit tests
npm run check    # type check
npm run build    # builds the site and validates every song
```

`npm run build` is the important one: it refuses to finish if a song has an unknown tag, a malformed YouTube id, or a translation that doesn't line up.

To see the exact site that will be published:

```sh
npm run preview  # serves the built site at http://localhost:4321/capoeira/
```

To check printing, open a song, press the **הדפסה** button and look at the print preview (choose "Save as PDF" to get a file).

---

## 8. Publish (deploy)

Publishing = getting your change onto the `main` branch. GitHub Actions then builds the site and puts it live, usually within two minutes.

### Recommended: through a pull request

1. Commit and push your branch:

   ```sh
   git add -A
   git commit -m "Add Paranauê"
   git push -u origin add-song-paranaue
   ```

2. Open the link Git prints (or go to the repository on GitHub and click **Compare & pull request**), and create the pull request.
3. Wait for the **CI** check on the pull request to turn green. It runs the same checks as [step 7](#7-check-your-changes-before-publishing).
4. Click **Merge pull request**.
5. Go to the **Actions** tab and watch the **Deploy to GitHub Pages** run. When it's green, the change is live at https://bemtevi-roda.github.io/capoeira/.

### Quick: push straight to `main`

```sh
git checkout main
git pull
# …make and commit your changes…
git push
```

This deploys immediately, without the pull-request check, so run [step 7](#7-check-your-changes-before-publishing) first.

### Re-deploy without changes

Actions tab → **Deploy to GitHub Pages** → **Run workflow** → **Run workflow**.

### One-time repository settings (already done)

These are listed in case the repository is ever recreated or moved. They need a repository admin.

1. **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
2. The address `…github.io/capoeira/` comes from the repository name. If the repository is renamed, change `base` in [`astro.config.mjs`](astro.config.mjs) to `'/<new-name>'`.

### Using your own domain (optional)

1. Create `public/CNAME` containing just the domain, e.g. `songs.example.com`.
2. In [`astro.config.mjs`](astro.config.mjs), set `site: 'https://songs.example.com'` and delete the `base` line.
3. At your domain registrar, add a DNS `CNAME` record pointing the domain to `bemtevi-roda.github.io`.
4. In **Settings → Pages**, enter the domain under **Custom domain** and tick **Enforce HTTPS** once it's available.
5. Commit and push.

---

## 9. Editing without installing anything (GitHub website)

Small edits — fixing a word, adding a translation — can be done entirely on github.com.

**Add a new song with the website's form** (easiest)

1. Create a token (one time): on GitHub open **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Set **Resource owner** to `bemtevi-roda`, **Repository access** to *Only select repositories → capoeira*, and under **Repository permissions** set **Contents** and **Pull requests** to *Read and write*. Copy the token.
2. On the site, open the **About** tab and click **+ Add a song** at the bottom (or open `…/capoeira/new-song/`).
3. The first time, you land on the **Connect** page: paste the token and click **Connect**. Once GitHub confirms the token can write to the repository, the form opens. Tick *Remember the token on this device* to skip this step next time.
4. Fill in the song. The form checks that the translation lines up and shows a preview; the line numbers help match the two texts.
5. Click **Open pull request**. Follow the link, wait for the **CI** check to turn green, and click **Merge pull request**. The song is live a few minutes later.

The token stays in your browser and is only sent to GitHub. Delete it any time on GitHub, or click **Forget token** on the form. If the organization requires approval for tokens, an owner has to approve it once (Organization settings → Personal access tokens → Pending requests).

**Edit an existing song**

1. Open the repository on GitHub and go to `src/content/songs/<slug>/index.md`.
2. Click the **pencil** icon (Edit this file).
3. Make your change. Keep the two-space indentation of lyric and translation lines.
4. Click **Commit changes…**, choose **Create a new branch … and start a pull request**, and confirm.
5. On the pull request, wait for the **CI** check. If it's red, click **Details** to see which song or line is wrong, fix it the same way, and the check runs again.
6. When it's green, click **Merge pull request**. The site updates within a couple of minutes.

**Add a new song**

1. Go to `src/content/songs/` and click **Add file → Create new file**.
2. Type the name as `new-slug/index.md` — typing `/` creates the folder.
3. Paste the template from [step 4](#4-add-a-new-song) and fill it in.
4. To add a picture: open the new folder, **Add file → Upload files**, and upload `cover.jpg`.
5. Commit to a new branch and open a pull request, as above.

---

## 10. Troubleshooting

| Problem                                                     | What to do                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build` says _does not match collection schema_     | Read the lines under it: they name the song folder and the field. Common causes: a tag not listed in `src/data/tags.ts`; a full YouTube URL instead of the 11-character id; a translation with a different number of lines. |
| _Invalid option: expected one of "benguela" \| "sao-bento"_ | The tag is misspelled, or needs adding to `src/data/tags.ts`.                                                                                                                                                               |
| Build fails with a YAML error                               | A lyric/translation line is missing its two leading spaces, or a title contains a `"` that isn't escaped.                                                                                                                   |
| The site shows a 404, or appears without styles             | `base` in `astro.config.mjs` doesn't match the repository name.                                                                                                                                                             |
| A change is merged but not visible                          | Check the **Actions** tab; if the deploy is still running, wait. If it's green, hard-refresh the page (`Ctrl/Cmd + Shift + R`).                                                                                             |
| The deploy job fails with a Pages error                     | Make sure **Settings → Pages → Source** is **GitHub Actions**.                                                                                                                                                              |
| A printed song spills onto a second page                    | Shouldn't happen; please open an issue with the song name and browser. Chrome gives the most accurate print layout.                                                                                                         |

---

## 11. Reference

### Lyrics format

| Write                     | Meaning                                              |
| ------------------------- | ---------------------------------------------------- |
| one line of text          | one sung line                                        |
| an empty line             | a new stanza                                         |
| `> ` at the start         | a coro (chorus/response) line — shown **bold**, indented and coloured (in the original Google Doc, coro lines were bold) |
| ` x2` at the end          | a repeat badge (any number: `x3`, `x4`…)             |
| `~` as a translation line | that line has no translation (`> ~` works too)       |

### Song fields

| Field                        | Required | Description                                                     |
| ---------------------------- | -------- | --------------------------------------------------------------- |
| `titles`                     | yes      | List of names; the first is the main title. All are searchable. |
| `tags`                       | no       | List of tag keys from `src/data/tags.ts`.                       |
| `image`                      | no       | Path to the picture, usually `./cover.jpg`.                     |
| `imageAlt`                   | no       | Hebrew description of the picture, for screen readers.          |
| `imageAltEn`                 | no       | English description of the picture.                             |
| `youtube`                    | no       | 11-character YouTube video id.                                  |
| `youtubeStart`               | no       | Start the video at this many seconds.                           |
| `lyrics`                     | yes      | Portuguese lyrics.                                              |
| `hebrew`                     | no       | Hebrew translation, line for line with `lyrics`.                |
| `english`                    | no       | English translation, line for line with `lyrics`.               |
| `notesEn`                    | no       | English notes (plain text), shown in the "Notes" box.           |
| text after the closing `---` | no       | Hebrew notes (Markdown), shown in the "הערות" box.              |

### Commands

| Command           | What it does                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `npm install`     | Install dependencies (after cloning, or when `package.json` changes) |
| `npm run dev`     | Development server with live reload                                  |
| `npm test`        | Unit tests                                                           |
| `npm run check`   | Type check                                                           |
| `npm run build`   | Build into `dist/` and validate all songs                            |
| `npm run preview` | Serve the built `dist/` locally                                      |

### Where the first songs came from

The first 13 songs were imported from the group's original Google Doc with `npm run import:gdoc` ([`scripts/import-gdoc.ts`](scripts/import-gdoc.ts)). The repository is now the source of truth: edit songs here, not in the Doc. The import script refuses to overwrite existing songs unless run with `--force`, which would undo all edits made since.
