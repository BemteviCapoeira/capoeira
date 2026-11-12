import { alignmentIssues, parseLyrics } from '../lib/lyrics';
import { normalizeLyrics, parseYouTube, SLUG, songMarkdown } from '../lib/song-file';
import { slugify } from '../lib/text';
import { CONNECT_URL, isTokenProblem, tokenStore, verifyToken, type Session } from './auth';
import { explain, type NewFile } from './github';
import { handleLyricsPaste } from './paste-lyrics';

const DRAFT_KEY = 'newSongDraft';
const MAX_IMAGE_SIDE = 1600;

interface PageData {
  slugs: string[];
  songsUrl: string;
}

function goToConnect(reason?: string) {
  location.replace(reason ? `${CONNECT_URL}?reason=${reason}` : CONNECT_URL);
}

const draftStore = {
  get(): Record<string, unknown> | null {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    } catch {
      return null;
    }
  },
  set(draft: Record<string, unknown>) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  },
  remove() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  },
};

async function resizeImage(file: File): Promise<{ base64: string; url: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff'; // transparent PNGs get a white background in the JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL('image/jpeg', 0.85);
  return { url, base64: url.slice(url.indexOf(',') + 1) };
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The song form. Without a working saved token it sends the visitor to the connect page instead. */
export async function initNewSongForm() {
  const form = document.querySelector<HTMLFormElement>('[data-new-song]');
  const dataEl = document.getElementById('new-song-data');
  const sessionStatus = document.querySelector<HTMLElement>('[data-session-status]');
  if (!form || !dataEl || !sessionStatus) return;

  const token = tokenStore.get();
  if (!token) return goToConnect();

  let session: Session;
  try {
    session = await verifyToken(token);
  } catch (error) {
    if (isTokenProblem(error)) {
      tokenStore.remove();
      return goToConnect('invalid');
    }
    sessionStatus.textContent = `${explain(error)} Reload the page to try again.`;
    sessionStatus.dataset.tone = 'error';
    return;
  }

  sessionStatus.textContent = '';
  const sessionBar = document.querySelector<HTMLElement>('[data-session]')!;
  sessionBar.querySelector('[data-login]')!.textContent = `@${session.login}`;
  sessionBar.hidden = false;
  sessionBar.querySelector('[data-forget]')!.addEventListener('click', () => {
    tokenStore.remove();
    goToConnect('signed-out');
  });
  form.hidden = false;

  setUpForm(form, session, JSON.parse(dataEl.textContent ?? '{}') as PageData);
}

function setUpForm(form: HTMLFormElement, session: Session, data: PageData) {
  const $ = <T extends Element = HTMLElement>(sel: string) => form.querySelector<T>(sel)!;
  const field = <T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(name: string) =>
    form.elements.namedItem(name) as T;

  const el = {
    title: field('title'),
    aka: field<HTMLTextAreaElement>('aka'),
    slug: field('slug'),
    slugStatus: $('[data-slug-status]'),
    youtube: field('youtube'),
    youtubeStatus: $('[data-youtube-status]'),
    youtubePreview: $<HTMLImageElement>('[data-youtube-preview]'),
    image: field('image'),
    picture: $('[data-picture]'),
    picturePreview: $<HTMLImageElement>('[data-picture-preview]'),
    altField: $('[data-alt]'),
    imageAlt: field('imageAlt'),
    lyrics: field<HTMLTextAreaElement>('lyrics'),
    translation: field<HTMLTextAreaElement>('translation'),
    notes: field<HTMLTextAreaElement>('notes'),
    alignStatus: $('[data-align-status]'),
    preview: $('[data-preview]'),
    problems: $('[data-problems]'),
    submitStatus: $('[data-submit-status]'),
    submit: $<HTMLButtonElement>('[data-submit]'),
    send: $('[data-send]'),
    done: $('[data-done]'),
    prLink: $<HTMLAnchorElement>('[data-pr-link]'),
  };

  let slugTouched = false;
  let picture: { base64: string; url: string } | undefined;

  const setStatus = (node: HTMLElement, text: string, tone: 'info' | 'ok' | 'error' = 'info') => {
    node.textContent = text;
    node.dataset.tone = tone;
  };

  const selectedTags = () =>
    [...form.querySelectorAll<HTMLInputElement>('input[name=tags]:checked')].map((input) => input.value);

  const titles = () => [
    el.title.value.trim(),
    ...el.aka.value
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean),
  ];

  // ---- the song ----
  function checkSlug(): string | undefined {
    const slug = el.slug.value.trim();
    if (!slug) return 'Add a title to get a web address.';
    if (!SLUG.test(slug)) return 'Use only lowercase letters, numbers and dashes (e.g. "eu-tava-la-na-bahia").';
    if (data.slugs.includes(slug)) return 'A song with this web address already exists.';
    return undefined;
  }

  function updateSlug() {
    if (!slugTouched) el.slug.value = slugify(el.title.value);
    const problem = checkSlug();
    el.slugStatus.textContent = problem ?? `${data.songsUrl}${el.slug.value}/`;
    el.slugStatus.dataset.tone = problem ? 'error' : 'ok';
  }

  function updateYouTube() {
    const value = el.youtube.value.trim();
    const video = value ? parseYouTube(value) : undefined;
    el.youtubePreview.hidden = !video;
    if (!value) el.youtubeStatus.textContent = '';
    else if (!video) el.youtubeStatus.textContent = "That doesn't look like a YouTube link.";
    else {
      el.youtubeStatus.textContent = `Video ${video.id}${video.start ? `, starting at ${formatTime(video.start)}` : ''}`;
      el.youtubePreview.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
    }
  }

  el.image.addEventListener('change', async () => {
    const file = el.image.files?.[0];
    if (!file) return;
    try {
      picture = await resizeImage(file);
      el.picturePreview.src = picture.url;
      el.picture.hidden = false;
      el.altField.hidden = false;
    } catch {
      picture = undefined;
      el.image.value = '';
      alert("This picture couldn't be read. Try a JPG or PNG.");
    }
  });

  $('[data-picture-remove]').addEventListener('click', () => {
    picture = undefined;
    el.image.value = '';
    el.picture.hidden = true;
    el.altField.hidden = true;
  });

  // ---- lyrics ----
  function updateGutter(textarea: HTMLTextAreaElement) {
    const gutter = textarea.previousElementSibling as HTMLElement;
    const count = Math.max(textarea.value.split('\n').length, textarea.rows);
    gutter.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
    gutter.scrollTop = textarea.scrollTop;
  }

  function lyricsProblems(): string[] {
    if (!el.lyrics.value.trim()) return [];
    return alignmentIssues(normalizeLyrics(el.lyrics.value), normalizeLyrics(el.translation.value));
  }

  function updateLyrics() {
    updateGutter(el.lyrics);
    updateGutter(el.translation);

    const lyrics = normalizeLyrics(el.lyrics.value);
    const translation = normalizeLyrics(el.translation.value);
    const issues = lyricsProblems();
    if (!lyrics) setStatus(el.alignStatus, '');
    else if (!translation) setStatus(el.alignStatus, 'No translation yet. That is fine; it can be added later.');
    else if (issues.length) setStatus(el.alignStatus, `The translation doesn't line up: ${issues.join('; ')}.`, 'error');
    else setStatus(el.alignStatus, 'The translation lines up with the lyrics.', 'ok');

    el.preview.replaceChildren(
      ...(lyrics ? parseLyrics(lyrics, issues.length ? undefined : translation) : []).map((stanza) => {
        const div = document.createElement('div');
        div.className = 'p-stanza';
        for (const line of stanza) {
          const row = document.createElement('div');
          row.className = line.coro ? 'p-line coro' : 'p-line';
          row.append(line.pt);
          if (line.repeat) {
            const rep = document.createElement('span');
            rep.className = 'p-rep';
            rep.textContent = `×${line.repeat}`;
            row.append(rep);
          }
          if (line.he) {
            const tr = document.createElement('div');
            tr.className = 'p-tr';
            tr.dir = 'rtl';
            tr.lang = 'he';
            tr.textContent = line.he;
            row.append(tr);
          }
          div.append(row);
        }
        return div;
      }),
    );
  }

  for (const textarea of [el.lyrics, el.translation]) {
    textarea.addEventListener('scroll', () => updateGutter(textarea));
  }
  handleLyricsPaste(el.lyrics);

  // ---- draft: keep typed text if the page is reloaded ----
  const DRAFT_FIELDS = ['title', 'aka', 'slug', 'youtube', 'imageAlt', 'lyrics', 'translation', 'notes'] as const;

  function saveDraft() {
    const draft: Record<string, unknown> = { slugTouched, tags: selectedTags() };
    for (const name of DRAFT_FIELDS) draft[name] = field(name).value;
    draftStore.set(draft);
  }

  function restoreDraft() {
    const draft = draftStore.get();
    if (!draft) return;
    for (const name of DRAFT_FIELDS) if (typeof draft[name] === 'string') field(name).value = draft[name];
    slugTouched = Boolean(draft.slugTouched);
    for (const input of form.querySelectorAll<HTMLInputElement>('input[name=tags]')) {
      input.checked = Array.isArray(draft.tags) && draft.tags.includes(input.value);
    }
  }

  function refresh() {
    updateSlug();
    updateYouTube();
    updateLyrics();
  }

  let saveTimer: number | undefined;
  form.addEventListener('input', (e) => {
    if (e.target === el.slug) slugTouched = el.slug.value.trim() !== '';
    refresh();
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveDraft, 300);
  });
  form.addEventListener('change', saveDraft);

  // ---- send ----
  function problems(): string[] {
    const list: string[] = [];
    if (!el.title.value.trim()) list.push('Enter the song title.');
    const slugProblem = el.title.value.trim() ? checkSlug() : undefined;
    if (slugProblem) list.push(`Web address: ${slugProblem}`);
    if (el.youtube.value.trim() && !parseYouTube(el.youtube.value)) list.push('Fix the YouTube link, or clear it.');
    if (!el.lyrics.value.trim()) list.push('Enter the lyrics.');
    for (const issue of lyricsProblems()) list.push(`Translation: ${issue}.`);
    return list;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const list = problems();
    el.problems.replaceChildren(
      ...list.map((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        return li;
      }),
    );
    el.problems.hidden = list.length === 0;
    if (list.length) return;

    const slug = el.slug.value.trim();
    const title = el.title.value.trim();
    const folder = `src/content/songs/${slug}`;
    el.submit.disabled = true;
    try {
      setStatus(el.submitStatus, 'Checking the web address…');
      if (await session.client.exists(folder, session.defaultBranch)) {
        setStatus(el.submitStatus, 'A song with this web address was just added by someone else. Choose another one.', 'error');
        return;
      }
      const markdown = songMarkdown({
        titles: titles(),
        tags: selectedTags(),
        image: picture ? 'cover.jpg' : undefined,
        imageAlt: el.imageAlt.value.trim(),
        youtube: parseYouTube(el.youtube.value),
        lyrics: el.lyrics.value,
        translation: el.translation.value,
        notes: el.notes.value,
      });
      const files: NewFile[] = [{ path: `${folder}/index.md`, text: markdown }];
      if (picture) files.push({ path: `${folder}/cover.jpg`, base64: picture.base64 });

      const url = await session.client.openPullRequest({
        base: session.defaultBranch,
        branch: `add-song/${slug}`,
        files,
        message: `Add song: ${title}`,
        title: `Add song: ${title}`,
        body: [
          `Adds **${title}** using the website's "Add a song" form.`,
          '',
          `- Page after merging: ${data.songsUrl}${slug}/`,
          `- Tags: ${selectedTags().join(', ') || 'none'}`,
          `- Translation: ${el.translation.value.trim() ? 'yes' : 'not yet'}`,
          `- Picture: ${picture ? 'yes' : 'no'}`,
          '',
          'The CI check validates the song. Merge to publish it.',
        ].join('\n'),
        onProgress: (step) => setStatus(el.submitStatus, step),
      });

      setStatus(el.submitStatus, '');
      el.prLink.href = url;
      el.prLink.textContent = url;
      el.send.hidden = true;
      el.done.hidden = false;
      draftStore.remove();
    } catch (error) {
      if (isTokenProblem(error) && !(error instanceof Error && error.name === 'NoWriteAccess')) {
        setStatus(el.submitStatus, `${explain(error)} Your draft is saved; connect again and send it.`, 'error');
      } else {
        setStatus(el.submitStatus, explain(error), 'error');
      }
    } finally {
      el.submit.disabled = false;
    }
  });

  $('[data-again]').addEventListener('click', () => {
    form.reset();
    picture = undefined;
    slugTouched = false;
    el.picture.hidden = true;
    el.altField.hidden = true;
    el.send.hidden = false;
    el.done.hidden = true;
    setStatus(el.submitStatus, '');
    draftStore.remove();
    refresh();
    window.scrollTo({ top: 0 });
  });

  restoreDraft();
  refresh();
}
