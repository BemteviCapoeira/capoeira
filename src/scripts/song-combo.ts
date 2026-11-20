import { fold } from '../lib/text';

export interface SongCombo {
  /** The chosen song's `<li>` (its data-value is the slug, data-url the page), if one is chosen. */
  selected(): HTMLElement | undefined;
  /** The text box people type in (to mark it invalid or focus it). */
  input: HTMLInputElement;
  reset(): void;
}

/**
 * A text box with a list of songs under it (an ARIA combobox). Typing opens the list with the songs whose names
 * contain the text (accents and case ignored); click or Enter picks one. The chosen slug goes into the hidden
 * input `name="song"`, so the form reads it like any other field. Unlike a <select>, this filters on every device.
 */
export function initSongCombo(root: HTMLElement): SongCombo {
  const input = root.querySelector<HTMLInputElement>('[role=combobox]')!;
  const list = root.querySelector<HTMLElement>('[role=listbox]')!;
  const empty = root.querySelector<HTMLElement>('[data-combo-empty]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-combo-toggle]')!;
  const hidden = root.querySelector<HTMLInputElement>('input[type=hidden]')!;
  const options = [...list.querySelectorAll<HTMLElement>('[role=option]')];
  let active: HTMLElement | undefined;

  const visible = () => options.filter((o) => !o.hidden);
  const selected = () => options.find((o) => o.dataset.value === hidden.value && hidden.value);

  const filter = (text: string) => {
    const query = fold(text);
    for (const option of options) option.hidden = !option.dataset.search!.includes(query);
    empty.hidden = visible().length > 0;
  };

  const setActive = (option: HTMLElement | undefined) => {
    active?.classList.remove('active');
    active = option;
    if (option) {
      option.classList.add('active');
      option.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', option.id);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const open = () => {
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(selected() && !selected()!.hidden ? selected() : visible()[0]);
  };

  const close = () => {
    list.hidden = true;
    empty.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(undefined);
  };

  const choose = (option: HTMLElement | undefined) => {
    for (const o of options) o.setAttribute('aria-selected', String(o === option));
    hidden.value = option?.dataset.value ?? '';
    if (option) input.value = option.textContent!.trim();
    hidden.dispatchEvent(new Event('input', { bubbles: true }));
  };

  /** Opens the list: filtered by the text, or every song when the text is just the chosen song's name. */
  const openForText = () => {
    filter(selected() && input.value === selected()!.textContent!.trim() ? '' : input.value);
    open();
  };

  input.addEventListener('input', () => {
    if (hidden.value) choose(undefined);
    filter(input.value);
    open();
  });

  input.addEventListener('click', () => {
    if (list.hidden) openForText();
  });

  toggle.addEventListener('click', () => {
    if (list.hidden) {
      openForText();
      input.focus();
    } else {
      close();
    }
  });

  input.addEventListener('keydown', (e) => {
    const shown = visible();
    const index = active ? shown.indexOf(active) : -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) return openForText();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(shown[Math.min(Math.max(index + step, 0), shown.length - 1)]);
    } else if (e.key === 'Enter' && !list.hidden) {
      e.preventDefault(); // pick the song, don't send the form
      if (active) {
        choose(active);
        close();
      }
    } else if (e.key === 'Escape' && !list.hidden) {
      e.preventDefault();
      close();
    }
  });

  // Keep the focus in the text box while clicking a song, then pick it.
  list.addEventListener('mousedown', (e) => e.preventDefault());
  list.addEventListener('click', (e) => {
    const option = (e.target as HTMLElement).closest<HTMLElement>('[role=option]');
    if (!option) return;
    choose(option);
    close();
  });

  // Leaving the box: a search that left exactly one song picks it.
  root.addEventListener('focusout', (e) => {
    if (root.contains(e.relatedTarget as Node)) return;
    if (!hidden.value && input.value.trim() && visible().length === 1) choose(visible()[0]);
    close();
  });

  return {
    input,
    selected,
    reset() {
      input.value = '';
      choose(undefined);
      filter('');
      close();
    },
  };
}
