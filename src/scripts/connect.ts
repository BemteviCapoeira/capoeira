import { explain } from './github';
import { FORM_URL, isTokenProblem, tokenStore, verifyToken } from './auth';

const REASONS: Record<string, string> = {
  invalid: 'Your saved token no longer works (it may have expired or been revoked). Paste a new one.',
  'signed-out': 'The token was removed from this browser.',
};

/** The token page: check a pasted token against GitHub, save it, and only then go to the form. */
export function initConnect() {
  const form = document.querySelector<HTMLFormElement>('[data-connect-form]');
  if (!form) return;
  const input = form.elements.namedItem('token') as HTMLInputElement;
  const remember = form.elements.namedItem('remember') as HTMLInputElement;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const broken = form.querySelector<HTMLElement>('[data-broken]');

  /** `badToken` shows the broken berimbau next to the message. */
  const show = (text: string, tone: 'info' | 'error' = 'info', badToken = false) => {
    status.textContent = text;
    status.dataset.tone = tone;
    if (broken) broken.hidden = !badToken;
  };

  const reason = new URLSearchParams(location.search).get('reason');
  if (reason === 'invalid') show(REASONS.invalid, 'error', true);
  else if (reason && REASONS[reason]) show(REASONS[reason]);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = input.value.trim();
    if (!token) {
      show('Paste your token first.', 'error');
      input.focus();
      return;
    }
    button.disabled = true;
    show('Checking the token with GitHub…');
    try {
      const session = await verifyToken(token);
      tokenStore.set(token, remember.checked);
      show(`Connected as @${session.login}. Opening the form…`);
      location.replace(FORM_URL);
    } catch (error) {
      show(explain(error), 'error', isTokenProblem(error));
      button.disabled = false;
    }
  });
}
