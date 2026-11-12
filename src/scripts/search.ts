import { fold } from '../lib/text';

/**
 * Home-page song search. The full list is rendered as HTML; this only hides/reorders cards.
 * Text matches all of a song's names (best) or its lyrics/translation; tags must all match.
 * State lives in the URL (?q=…&tag=…) so searches can be shared and survive back/forward.
 */
export function initSearch() {
  const form = document.querySelector<HTMLFormElement>('[data-search]');
  const list = document.querySelector<HTMLElement>('[data-songs]');
  if (!form || !list) return;

  const input = form.querySelector<HTMLInputElement>('input[type=search]')!;
  const chips = [...form.querySelectorAll<HTMLButtonElement>('[data-tag]')];
  const items = [...list.querySelectorAll<HTMLElement>(':scope > li')];
  const count = document.querySelector<HTMLElement>('[data-count]');
  const empty = document.querySelector<HTMLElement>('[data-empty]');

  const selectedTags = () => chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.tag!);

  function apply() {
    const words = fold(input.value).split(' ').filter(Boolean);
    const tags = selectedTags();
    let shown = 0;

    for (const item of items) {
      const titles = item.dataset.titles ?? '';
      const text = `${titles} ${item.dataset.text ?? ''}`;
      const itemTags = (item.dataset.tags ?? '').split(' ');
      const inTitle = words.every((w) => titles.includes(w));
      const match = tags.every((t) => itemTags.includes(t)) && (inTitle || words.every((w) => text.includes(w)));
      item.hidden = !match;
      item.style.order = words.length && !inTitle ? '1' : ''; // title matches first
      if (match) shown++;
    }

    if (count) count.textContent = shown === 1 ? 'שיר אחד' : `${shown} שירים`;
    if (empty) empty.hidden = shown > 0;
  }

  function syncUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('tag');
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    for (const tag of selectedTags()) url.searchParams.append('tag', tag);
    history.replaceState(null, '', url);
  }

  function readUrl() {
    const params = new URL(location.href).searchParams;
    input.value = params.get('q') ?? '';
    const tags = params.getAll('tag');
    for (const chip of chips) chip.setAttribute('aria-pressed', String(tags.includes(chip.dataset.tag!)));
    apply();
  }

  input.addEventListener('input', () => {
    apply();
    syncUrl();
  });
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
      apply();
      syncUrl();
    });
  }
  window.addEventListener('pageshow', readUrl);
  readUrl();
}
