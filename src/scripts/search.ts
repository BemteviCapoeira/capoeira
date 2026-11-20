import { fold } from '../lib/text';
import { sortNewestFirst } from '../lib/song-order';
import { likedSongs, onLikesChange } from './likes';

/**
 * Home-page song search. The full list is rendered as HTML; this only hides/reorders cards.
 * Text matches all of a song's names (best) or its lyrics/translation. One tag can be selected
 * at a time: clicking a tag selects only it, clicking it again clears it. "Liked" shows only the songs
 * liked on this device (see likes.ts) and combines with the rest.
 * State lives in the URL (?q=…&tag=…&sort=newest&liked=1) so filters can be shared.
 */
export function initSearch() {
  const form = document.querySelector<HTMLFormElement>('[data-search]');
  const list = document.querySelector<HTMLElement>('[data-songs]');
  if (!form || !list) return;

  const input = form.querySelector<HTMLInputElement>('input[type=search]')!;
  const chips = [...form.querySelectorAll<HTMLButtonElement>('[data-tag]')];
  const items = [...list.querySelectorAll<HTMLElement>(':scope > li')];
  const newestItems = sortNewestFirst(items);
  const newestButton = form.querySelector<HTMLButtonElement>('[data-newest]')!;
  const likedButton = form.querySelector<HTMLButtonElement>('[data-liked-filter]')!;
  const tooltipHosts = [...form.querySelectorAll<HTMLButtonElement>('.tooltip-host')];
  const count = document.querySelector<HTMLElement>('[data-count]');
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const emptySearch = document.querySelector<HTMLElement>('[data-empty-search]');
  const emptyLiked = document.querySelector<HTMLElement>('[data-empty-liked]');
  const emptyLikedNote = document.querySelector<HTMLElement>('[data-empty-liked-note]');
  const emptyLikedMatches = document.querySelector<HTMLElement>('[data-empty-liked-matches]');
  let newest = false;
  let likedOnly = false;
  const TOOLTIP_DURATION_MS = 2000;

  for (const host of tooltipHosts) {
    let tooltipTimer: number | undefined;
    const isTouchView = () => window.matchMedia('(max-width: 560px), (pointer: coarse)').matches;

    const showTooltipTemporarily = () => {
      host.classList.remove('tooltip-dismissed');
      host.classList.add('tooltip-visible');
      if (tooltipTimer !== undefined) window.clearTimeout(tooltipTimer);
      tooltipTimer = window.setTimeout(() => {
        host.classList.remove('tooltip-visible');
        host.classList.add('tooltip-dismissed');
      }, TOOLTIP_DURATION_MS);
    };

    const resetTooltip = () => {
      if (tooltipTimer !== undefined) window.clearTimeout(tooltipTimer);
      host.classList.remove('tooltip-visible');
      host.classList.remove('tooltip-dismissed');
    };

    if (isTouchView()) {
      host.addEventListener('pointerdown', showTooltipTemporarily);
      host.addEventListener('click', showTooltipTemporarily);
    } else {
      host.addEventListener('mouseenter', showTooltipTemporarily);
      host.addEventListener('mouseleave', resetTooltip);
      host.addEventListener('focusin', showTooltipTemporarily);
      host.addEventListener('focusout', resetTooltip);
    }
  }

  const selectedTags = () => chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.tag!);

  function apply() {
    const words = fold(input.value).split(' ').filter(Boolean);
    const tags = selectedTags();
    const liked = likedOnly ? likedSongs() : undefined;
    let shown = 0;

    for (const [index, item] of (newest ? newestItems : items).entries()) {
      const titles = item.dataset.titles ?? '';
      const text = `${titles} ${item.dataset.text ?? ''}`;
      const itemTags = (item.dataset.tags ?? '').split(' ');
      const inTitle = words.every((w) => titles.includes(w));
      const match =
        tags.every((t) => itemTags.includes(t)) &&
        (!liked || liked.has(item.dataset.slug!)) &&
        (inTitle || words.every((w) => text.includes(w)));
      item.hidden = !match;
      if (newest) item.style.order = String(index + (words.length && !inTitle ? items.length : 0));
      else item.style.order = words.length && !inTitle ? '1' : ''; // title matches first
      if (match) shown++;
    }

    if (count) {
      const description = [
        chips.find((chip) => chip.getAttribute('aria-pressed') === 'true')?.dataset.countLabel,
        likedOnly ? likedButton.dataset.countLabel : undefined,
        newest ? newestButton.dataset.countLabel : count.dataset.sortLabel,
      ].filter(Boolean);
      const total = shown === 1 ? count.dataset.one! : count.dataset.many!.replace('{n}', String(shown));
      count.textContent = [total, ...description].join(' • ');
    }
    if (empty) empty.hidden = shown > 0;
    // Nothing liked yet: explain the hearts instead of "no such song".
    const noLikes = !!liked && liked.size === 0;
    const noLikedMatches = likedOnly && !noLikes && shown === 0;
    if (emptySearch) emptySearch.hidden = noLikes || noLikedMatches;
    if (emptyLiked) emptyLiked.hidden = !noLikes;
    if (emptyLikedNote) emptyLikedNote.hidden = !noLikes;
    if (emptyLikedMatches) emptyLikedMatches.hidden = !noLikedMatches;
  }

  function syncUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('tag');
    url.searchParams.delete('sort');
    url.searchParams.delete('liked');
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    const [tag] = selectedTags();
    if (tag) url.searchParams.set('tag', tag);
    if (newest) url.searchParams.set('sort', 'newest');
    if (likedOnly) url.searchParams.set('liked', '1');
    history.replaceState(null, '', url);
  }

  function readUrl() {
    const params = new URL(location.href).searchParams;
    input.value = params.get('q') ?? '';
    const tag = params.get('tag');
    newest = params.get('sort') === 'newest';
    newestButton.setAttribute('aria-pressed', String(newest));
    likedOnly = params.get('liked') === '1';
    likedButton.setAttribute('aria-pressed', String(likedOnly));
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset.tag === tag));
    apply();
  }

  input.addEventListener('input', () => {
    apply();
    syncUrl();
  });
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const select = chip.getAttribute('aria-pressed') !== 'true';
      for (const other of chips) other.setAttribute('aria-pressed', String(other === chip && select));
      apply();
      syncUrl();
    });
  }
  newestButton.addEventListener('click', () => {
    newest = !newest;
    newestButton.setAttribute('aria-pressed', String(newest));
    apply();
    syncUrl();
  });
  likedButton.addEventListener('click', () => {
    likedOnly = !likedOnly;
    likedButton.setAttribute('aria-pressed', String(likedOnly));
    apply();
    syncUrl();
  });
  onLikesChange(apply);
  window.addEventListener('pageshow', readUrl);
  readUrl();
}
