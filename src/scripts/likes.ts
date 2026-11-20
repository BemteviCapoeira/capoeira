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
  let feedback: HTMLDivElement | undefined;
  let feedbackTimer: number | undefined;

  const sync = () => {
    const songs = likedSongs();
    for (const button of buttons()) {
      const liked = songs.has(button.dataset.like!);
      const action = liked ? button.dataset.likeRemove! : button.dataset.likeAdd!;
      button.setAttribute('aria-pressed', String(liked));
      button.title = action;
      button.setAttribute('aria-label', `${action}: ${button.dataset.likeTitle}`);
    }
  };

  const showFeedback = (button: HTMLButtonElement, liked: boolean) => {
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'like-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      document.body.append(feedback);
    }
    feedback.lang = button.dataset.likeLocale!;
    feedback.dir = button.dataset.likeLocale === 'he' ? 'rtl' : 'ltr';
    feedback.textContent = liked ? button.dataset.likeAdded! : button.dataset.likeRemoved!;
    feedback.dataset.visible = 'true';
    const buttonRect = button.getBoundingClientRect();
    feedback.style.top = `${buttonRect.bottom + 8}px`;
    feedback.style.left = '0px';
    const halfWidth = feedback.offsetWidth / 2;
    const center = Math.min(
      window.innerWidth - 16 - halfWidth,
      Math.max(16 + halfWidth, buttonRect.left + buttonRect.width / 2),
    );
    feedback.style.left = `${center}px`;
    if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => {
      feedback?.removeAttribute('data-visible');
    }, 1800);
  };

  document.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>('[data-like]');
    if (!button) return;
    e.preventDefault();
    const liked = button.getAttribute('aria-pressed') !== 'true';
    showFeedback(button, liked);
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
