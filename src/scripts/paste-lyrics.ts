/**
 * Pasting lyrics copied from the Google Doc (or any rich-text source): a line whose text is
 * all bold becomes a coro line ("> "). Indentation is kept, so normalizeLyrics() can also
 * turn indented lines into coro lines.
 */

const BLOCKS = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TR', 'BLOCKQUOTE', 'PRE']);

interface Segment {
  text: string;
  bold: boolean;
}

function isBold(el: HTMLElement, inherited: boolean): boolean {
  const weight = el.style.fontWeight;
  // Google Docs wraps clipboard HTML in <b style="font-weight:normal">, so inline styles win over the tag.
  if (weight) return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600;
  if (el.tagName === 'B' || el.tagName === 'STRONG') return true;
  return inherited;
}

function renderLine(segments: Segment[]): string {
  const text = segments.map((s) => s.text).join('');
  const visible = segments.filter((s) => s.text.replace(/[\s ]/g, ''));
  const bold = visible.length > 0 && visible.every((s) => s.bold);
  return bold ? `> ${text.replace(/ /g, ' ').trim()}` : text;
}

export function htmlToLyrics(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lines: string[] = [];
  let segments: Segment[] = [];
  const endLine = () => {
    lines.push(renderLine(segments));
    segments = [];
  };

  const walk = (node: Node, bold: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // whitespace-only text between block tags is formatting, not content
      if (node.textContent && (segments.length || node.textContent.trim())) {
        segments.push({ text: node.textContent.replace(/\n/g, ' '), bold });
      }
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'BR') return endLine();
    if (node.tagName === 'STYLE' || node.tagName === 'SCRIPT') return;
    const bolder = isBold(node, bold);
    const block = BLOCKS.has(node.tagName);
    if (block && segments.length) endLine();
    const before = lines.length;
    for (const child of node.childNodes) walk(child, bolder);
    if (block) {
      if (segments.length) endLine();
      else if (lines.length === before) lines.push(''); // an empty paragraph = a blank line
    }
  };

  walk(doc.body, false);
  if (segments.length) endLine();
  return lines.join('\n');
}

/** On paste of rich text into `textarea`, insert the lyrics with bold lines marked as coro. */
export function handleLyricsPaste(textarea: HTMLTextAreaElement) {
  textarea.addEventListener('paste', (e) => {
    const html = e.clipboardData?.getData('text/html');
    if (!html) return; // plain text: let the browser paste it
    const text = htmlToLyrics(html);
    if (!text.trim()) return;
    e.preventDefault();
    textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
