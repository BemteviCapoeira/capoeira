import { initSongCombo } from './song-combo';
import { contactPayload, validateContact, type ContactError, type ContactField, type ContactInput } from '../lib/contact';

/** The Contact page: show the fields for the chosen topic, check the form, and send it to FormSubmit. */
export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  const sent = document.querySelector<HTMLElement>('[data-sent]');
  if (!form || !sent) return;

  const errorText = JSON.parse(form.dataset.errors!) as Record<ContactError, string>;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const buttonLabel = button.textContent!;
  const message = form.querySelector<HTMLElement>('[data-message]')!;
  const songCombo = initSongCombo(form.querySelector<HTMLElement>('[data-song-combo]')!);
  /** Errors are shown once the person has tried to send; after that they update as they type. */
  let tried = false;

  const value = (name: string) => {
    const el = form.elements.namedItem(name);
    if (el instanceof RadioNodeList) return el.value;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
      ? el.value
      : '';
  };

  const read = (): ContactInput => ({
    name: value('name'),
    nickname: value('nickname'),
    email: value('email'),
    phone: value('phone'),
    topic: value('topic') as ContactInput['topic'],
    songName: value('songName'),
    youtube: value('youtube'),
    tags: [...form.querySelectorAll<HTMLInputElement>('input[name=tags]:checked')].map(
      (box) => box.value as ContactInput['tags'][number],
    ),
    song: value('song'),
    message: value('message'),
  });

  const showTopic = () => {
    const topic = value('topic');
    for (const section of form.querySelectorAll<HTMLElement>('[data-topic-fields]')) {
      section.hidden = section.dataset.topicFields !== topic;
    }
    message.hidden = !topic;
  };

  /** Marks the fields with problems; returns the first one. */
  const showErrors = (errors: Partial<Record<ContactField, ContactError>>): HTMLElement | undefined => {
    let first: HTMLElement | undefined;
    for (const slot of form.querySelectorAll<HTMLElement>('[data-error-for]')) {
      const field = slot.dataset.errorFor as ContactField;
      const error = errors[field];
      slot.textContent = error ? errorText[error] : '';
      slot.id = `error-${field}`;
      const controls =
        field === 'topic'
          ? [...form.querySelectorAll<HTMLInputElement>('input[name=topic]')]
          : field === 'song'
            ? [songCombo.input]
            : [form.elements.namedItem(field) as HTMLElement];
      for (const control of controls) {
        if (error) {
          control.setAttribute('aria-invalid', 'true');
          control.setAttribute('aria-describedby', slot.id);
        } else {
          control.removeAttribute('aria-invalid');
          control.removeAttribute('aria-describedby');
        }
      }
      if (error && !first) first = controls[0];
    }
    return first;
  };

  const setStatus = (text: string, tone?: 'error') => {
    status.textContent = text;
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
  };

  form.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).name === 'topic') showTopic();
  });
  form.addEventListener('input', () => {
    if (!tried) return;
    const errors = validateContact(read());
    showErrors(errors);
    if (!Object.keys(errors).length) setStatus('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    tried = true;
    const input = read();
    const first = showErrors(validateContact(input));
    if (first) {
      setStatus(form.dataset.fixErrors!, 'error');
      first.focus();
      return;
    }

    const song = songCombo.selected();
    const payload = contactPayload(input, {
      song: input.topic === 'song-comment' && song ? { title: song.textContent!.trim(), url: song.dataset.url! } : undefined,
      language: form.dataset.language!,
    });
    payload._honey = value('_honey');

    button.disabled = true;
    button.textContent = form.dataset.sending!;
    setStatus('');
    try {
      const response = await fetch(form.dataset.endpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
      if (!response.ok || String(result.success) !== 'true') {
        throw new Error(result.message || `FormSubmit answered ${response.status}`);
      }
      form.reset();
      songCombo.reset();
      tried = false;
      showTopic();
      form.hidden = true;
      sent.hidden = false;
      sent.focus();
    } catch (error) {
      console.error('Contact form:', error);
      setStatus(form.dataset.sendFailed!, 'error');
    } finally {
      button.disabled = false;
      button.textContent = buttonLabel;
    }
  });

  sent.querySelector('[data-send-another]')?.addEventListener('click', () => {
    sent.hidden = true;
    form.hidden = false;
    (form.elements.namedItem('name') as HTMLInputElement).focus();
  });

  showTopic();
}
