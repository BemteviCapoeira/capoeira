/**
 * Liked songs, remembered on this device only (localStorage; nothing is sent anywhere).
 * Stored as a JSON array of song slugs. Every heart button on the page stays in sync, also across tabs.
 */

const KEY = 'likedSongs';
const CHANGE = 'liked-songs-change';

export function likedSongs(): Set<string> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter((s): s is string => typeof s === 'string') : []);
  } catch {
    return new Set();
  }
}

export function setLiked(slug: string, liked: boolean): void {
  const songs = likedSongs();
  if (liked) songs.add(slug);
  else songs.delete(slug);
  try {
    localStorage.setItem(KEY, JSON.stringify([...songs]));
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
}

/** Calls `callback` when likes change: on this page, in another tab, or when returning to a cached page. */
export function onLikesChange(callback: () => void): void {
  window.addEventListener(CHANGE, callback);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) callback();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) callback();
  });
}

/** Wires every `[data-like="<slug>"]` button: shows the saved state and toggles it on click. */
export function initLikeButtons(): void {
  const buttons = () => document.querySelectorAll<HTMLButtonElement>('[data-like]');
  const sync = () => {
    const songs = likedSongs();
    for (const button of buttons()) button.setAttribute('aria-pressed', String(songs.has(button.dataset.like!)));
  };

  document.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>('[data-like]');
    if (!button) return;
    e.preventDefault();
    const liked = button.getAttribute('aria-pressed') !== 'true';
    setLiked(button.dataset.like!, liked);
    if (liked) {
      button.classList.remove('pop');
      void button.offsetWidth; // restart the animation
      button.classList.add('pop');
    }
  });

  onLikesChange(sync);
  sync();
}
