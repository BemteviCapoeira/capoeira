import { alignmentIssues, parseLyrics } from '../lib/lyrics';
import { normalizeLyrics, parseYouTube, SLUG, songMarkdown, updateSongMarkdown, type SongInput } from '../lib/song-file';
import { slugify } from '../lib/text';
import { CONNECT_URL, isTokenProblem, tokenStore, verifyToken, type Session } from './auth';
import { explain, type NewFile } from './github';
import { handleLyricsPaste } from './paste-lyrics';

const DRAFT_KEY = 'newSongDraft';
const MAX_IMAGE_SIDE = 1600;

interface PageData {
  slugs: string[];
  songs: Array<{
    slug: string;
    titles: string[];
    tags: string[];
    image?: string;
    imageAlt?: string;
    imageAltEn?: string;
    youtube?: string;
    youtubeStart?: number;
    lyrics: string;
    hebrew?: string;
    english?: string;
    notesHebrew?: string;
    notesEnglish?: string;
  }>;
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

  let mode: 'add' | 'edit' = 'add';
  let editingSlug: string | undefined;

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
    imageAltEn: field('imageAltEn'),
    lyrics: field<HTMLTextAreaElement>('lyrics'),
    hebrew: field<HTMLTextAreaElement>('hebrew'),
    english: field<HTMLTextAreaElement>('english'),
    notesHebrew: field<HTMLTextAreaElement>('notesHebrew'),
    notesEnglish: field<HTMLTextAreaElement>('notesEnglish'),
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
  let originalSong: SongInput | undefined;

  const setStatus = (node: HTMLElement, text: string, tone: 'info' | 'ok' | 'error' = 'info') => {
    node.textContent = text;
    node.dataset.tone = tone;
  };

  const selectedTags = () =>
    [...form.querySelectorAll<HTMLInputElement>('input[name=tags]:checked')].map((input) => input.value);

  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-admin-mode]')];
  const editPicker = document.querySelector<HTMLElement>('[data-edit-picker]')!;
  const editSong = document.querySelector<HTMLSelectElement>('[data-edit-song]')!;

  function setMode(nextMode: 'add' | 'edit') {
    mode = nextMode;
    for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.adminMode === mode));
    editPicker.hidden = mode !== 'edit';
    if (mode === 'edit') {
      el.slug.readOnly = true;
      el.slug.style.background = 'var(--sand)';
      el.submit.textContent = 'Open edit pull request';
      el.submit.disabled = editSong.value === '';
    } else {
      editingSlug = undefined;
      el.slug.readOnly = false;
      el.slug.style.background = '';
      el.submit.textContent = 'Open pull request';
      el.submit.disabled = false;
      form.reset();
      picture = undefined;
      slugTouched = false;
      el.picture.hidden = true;
      el.altField.hidden = true;
      refresh();
    }
  }

  function loadEditSong(slug: string) {
    const song = data.songs.find((item) => item.slug === slug);
    if (!song) return;
    editingSlug = song.slug;
    originalSong = {
      titles: song.titles,
      tags: song.tags,
      image: song.image ? 'cover.jpg' : undefined,
      imageAlt: song.imageAlt,
      imageAltEn: song.imageAltEn,
      youtube: song.youtube ? { id: song.youtube, start: song.youtubeStart } : undefined,
      lyrics: song.lyrics,
      hebrew: song.hebrew,
      english: song.english,
      notesHebrew: song.notesHebrew,
      notesEnglish: song.notesEnglish,
    };
    slugTouched = true;
    el.title.value = song.titles[0];
    el.aka.value = song.titles.slice(1).join('\n');
    el.slug.value = song.slug;
    el.youtube.value = song.youtube
      ? `https://youtu.be/${song.youtube}${song.youtubeStart ? `?t=${song.youtubeStart}` : ''}`
      : '';
    el.imageAlt.value = song.imageAlt ?? '';
    el.imageAltEn.value = song.imageAltEn ?? '';
    el.lyrics.value = song.lyrics;
    el.hebrew.value = song.hebrew ?? '';
    el.english.value = song.english ?? '';
    el.notesHebrew.value = song.notesHebrew ?? '';
    el.notesEnglish.value = song.notesEnglish ?? '';
    for (const input of form.querySelectorAll<HTMLInputElement>('input[name=tags]')) {
      input.checked = song.tags.includes(input.value);
    }
    picture = undefined;
    el.picture.hidden = true;
    el.altField.hidden = !song.image;
    if (song.image) {
      el.picturePreview.src = song.image;
      el.picture.hidden = false;
    }
    el.submit.disabled = false;
    refresh();
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => setMode(tab.dataset.adminMode === 'edit' ? 'edit' : 'add'));
  }
  editSong.addEventListener('change', () => loadEditSong(editSong.value));

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
    if (mode === 'add' && data.slugs.includes(slug)) return 'A song with this web address already exists.';
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

  const TRANSLATIONS = [
    { key: 'hebrew', name: 'Hebrew', lang: 'he', dir: 'rtl' },
    { key: 'english', name: 'English', lang: 'en', dir: 'ltr' },
  ] as const;

  /** Each translation with its alignment problems against the lyrics (empty text = no translation). */
  function translations() {
    const lyrics = normalizeLyrics(el.lyrics.value);
    return TRANSLATIONS.map((tr) => {
      const text = normalizeLyrics(el[tr.key].value);
      return { ...tr, text, issues: lyrics && text ? alignmentIssues(lyrics, text) : [] };
    });
  }

  function lyricsProblems(): string[] {
    return translations().flatMap((tr) => tr.issues.map((issue) => `${tr.name} translation: ${issue}.`));
  }

  function updateLyrics() {
    for (const textarea of [el.lyrics, el.hebrew, el.english]) updateGutter(textarea);

    const lyrics = normalizeLyrics(el.lyrics.value);
    const all = translations();
    const given = all.filter((tr) => tr.text);
    const broken = given.filter((tr) => tr.issues.length);
    const names = (list: typeof all) => list.map((tr) => tr.name).join(' and ');
    if (!lyrics) setStatus(el.alignStatus, '');
    else if (broken.length) {
      const text = broken.map((tr) => `The ${tr.name} translation doesn't line up: ${tr.issues.join('; ')}.`).join(' ');
      setStatus(el.alignStatus, text, 'error');
    } else if (!given.length) setStatus(el.alignStatus, 'No translations yet. That is fine; they can be added later.');
    else setStatus(el.alignStatus, `The ${names(given)} ${given.length > 1 ? 'translations line' : 'translation lines'} up with the lyrics.`, 'ok');

    // the preview shows every translation that lines up, under each line
    const shown = given.filter((tr) => !tr.issues.length).map((tr) => ({ ...tr, stanzas: parseLyrics(lyrics, tr.text) }));
    el.preview.replaceChildren(
      ...(lyrics ? parseLyrics(lyrics) : []).map((stanza, i) => {
        const div = document.createElement('div');
        div.className = 'p-stanza';
        stanza.forEach((line, j) => {
          const row = document.createElement('div');
          row.className = line.coro ? 'p-line coro' : 'p-line';
          row.append(line.pt);
          if (line.repeat) {
            const rep = document.createElement('span');
            rep.className = 'p-rep';
            rep.textContent = `×${line.repeat}`;
            row.append(rep);
          }
          for (const tr of shown) {
            const text = tr.stanzas[i][j].tr;
            if (!text) continue;
            const node = document.createElement('div');
            node.className = 'p-tr';
            node.dir = tr.dir;
            node.lang = tr.lang;
            node.textContent = text;
            row.append(node);
          }
          div.append(row);
        });
        return div;
      }),
    );
  }

  for (const textarea of [el.lyrics, el.hebrew, el.english]) {
    textarea.addEventListener('scroll', () => updateGutter(textarea));
  }
  handleLyricsPaste(el.lyrics);

  // ---- draft: keep typed text if the page is reloaded ----
  const DRAFT_FIELDS = [
    'title',
    'aka',
    'slug',
    'youtube',
    'imageAlt',
    'imageAltEn',
    'lyrics',
    'hebrew',
    'english',
    'notesHebrew',
    'notesEnglish',
  ] as const;

  function saveDraft() {
    const draft: Record<string, unknown> = { slugTouched, tags: selectedTags() };
    for (const name of DRAFT_FIELDS) draft[name] = field(name).value;
    draftStore.set(draft);
  }

  function restoreDraft() {
    const draft = draftStore.get();
    if (!draft) return;
    // drafts saved under older field names
    draft.hebrew ??= draft.translation;
    draft.notesHebrew ??= draft.notes;
    draft.notesEnglish ??= draft.notesEn;
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
    list.push(...lyricsProblems());
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
      setStatus(el.submitStatus, mode === 'edit' ? 'Reading the current song…' : 'Checking the web address…');
      if (mode === 'add' && await session.client.exists(folder, session.defaultBranch)) {
        setStatus(el.submitStatus, 'A song with this web address was just added by someone else. Choose another one.', 'error');
        return;
      }
      const updatedSong: SongInput = {
        titles: titles(),
        tags: selectedTags(),
        image: picture ? 'cover.jpg' : originalSong?.image,
        imageAlt: el.imageAlt.value.trim(),
        imageAltEn: el.imageAltEn.value.trim(),
        youtube: parseYouTube(el.youtube.value),
        lyrics: el.lyrics.value,
        hebrew: el.hebrew.value,
        english: el.english.value,
        notesHebrew: el.notesHebrew.value,
        notesEnglish: el.notesEnglish.value,
      };
      let markdown: string;
      let branch: string;
      let prTitle: string;
      let prBody: string;
      if (mode === 'edit') {
        if (!editingSlug || !originalSong) {
          setStatus(el.submitStatus, 'Choose a song to edit.', 'error');
          return;
        }
        const original = await session.client.getText(`${folder}/index.md`, session.defaultBranch);
        markdown = updateSongMarkdown(original, originalSong, updatedSong);
        branch = `edit-song/${editingSlug}`;
        prTitle = `Edit song: ${title}`;
        prBody = [
          `Edits **${title}** using the website's edit form.`,
          '',
          `- Page: ${data.songsUrl}${editingSlug}/`,
          '- Only the changed fields should be included in this pull request.',
          '',
          'The CI check validates the song. Merge to publish the changes.',
        ].join('\n');
      } else {
        markdown = songMarkdown(updatedSong);
        branch = `add-song/${slug}`;
        prTitle = `Add song: ${title}`;
        prBody = [
          `Adds **${title}** using the website's "Add a song" form.`,
          '',
          `- Page after merging: ${data.songsUrl}${slug}/`,
          `- Tags: ${selectedTags().join(', ') || 'none'}`,
          `- Hebrew translation: ${el.hebrew.value.trim() ? 'yes' : 'not yet'}`,
          `- English translation: ${el.english.value.trim() ? 'yes' : 'not yet'}`,
          `- Picture: ${picture ? 'yes' : 'no'}`,
          '',
          'The CI check validates the song. Merge to publish it.',
        ].join('\n');
      }
      const files: NewFile[] = [{ path: `${folder}/index.md`, text: markdown }];
      if (picture) files.push({ path: `${folder}/cover.jpg`, base64: picture.base64 });

      const url = await session.client.openPullRequest({
        base: session.defaultBranch,
        branch,
        files,
        message: `${mode === 'edit' ? 'Edit' : 'Add'} song: ${title}`,
        title: prTitle,
        body: prBody,
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
    editingSlug = undefined;
    originalSong = undefined;
    setMode('add');
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
