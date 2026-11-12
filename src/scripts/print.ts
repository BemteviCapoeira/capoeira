/**
 * Fit the song's print sheet (title + lyrics) onto a single A4 page, as large as possible.
 *
 * Measures an invisible copy of the sheet at the printable size and binary-searches the
 * largest font size at which (1) everything fits on one page and (2) no sung line has to
 * wrap — for 1, 2 and 3 columns — then applies the best one before the browser prints.
 * Only if no size avoids wrapping (an extremely long song) is wrapping allowed.
 */

// A4 is 210 × 297mm; print.css sets 12mm @page margins → 186 × 273mm printable.
// Measure a little smaller to absorb differences between browsers' margins and font rounding.
const PRINT_WIDTH_MM = 182;
const MAX_HEIGHT = (266 * 96) / 25.4; // px

const MIN_PT = 6;
const MAX_PT = 72;
const PRECISION = 0.25;
/** An extra column must buy at least this much bigger text (one column is easier to sing from). */
const COLUMN_GAIN = 1.1;

interface Fit {
  cols: number;
  pt: number;
}

function apply(el: HTMLElement, { cols, pt }: Fit) {
  el.style.setProperty('--print-cols', String(cols));
  el.style.setProperty('--print-size', `${pt}pt`);
}

function fits(probe: HTMLElement, allowWrap: boolean): boolean {
  if (probe.scrollHeight > MAX_HEIGHT) return false;
  if (allowWrap) return true;
  return [...probe.querySelectorAll<HTMLElement>('.print-line')].every((line) => line.scrollWidth <= line.clientWidth + 1);
}

/** Largest font size (to PRECISION) that fits in `cols` columns, or undefined if even MIN_PT doesn't. */
function largestSize(probe: HTMLElement, cols: number, allowWrap: boolean): number | undefined {
  const test = (pt: number) => {
    apply(probe, { cols, pt });
    return fits(probe, allowWrap);
  };
  if (!test(MIN_PT)) return undefined;
  let lo = MIN_PT; // fits
  let hi = MAX_PT; // assumed not to
  while (hi - lo > PRECISION) {
    const mid = (lo + hi) / 2;
    if (test(mid)) lo = mid;
    else hi = mid;
  }
  // Snap down to the grid, and step down further if rounding/column balancing disagrees.
  let pt = Math.floor(lo / PRECISION) * PRECISION;
  while (pt > MIN_PT && !test(pt)) pt -= PRECISION;
  return pt;
}

export function fitToPage(sheet: HTMLElement): Fit {
  const probe = sheet.cloneNode(true) as HTMLElement;
  probe.classList.add('print-probe');
  probe.style.width = `${PRINT_WIDTH_MM}mm`;
  document.body.append(probe);

  let best: Fit | undefined;
  for (const allowWrap of [false, true]) {
    probe.classList.toggle('print-nowrap', !allowWrap);
    for (const cols of [1, 2, 3]) {
      const pt = largestSize(probe, cols, allowWrap);
      if (pt && (!best || pt > best.pt * COLUMN_GAIN)) best = { cols, pt };
    }
    if (best) break;
  }
  best ??= { cols: 3, pt: MIN_PT };

  probe.remove();
  apply(sheet, best);
  sheet.dataset.fit = `${best.cols}col@${best.pt}pt`;
  return best;
}

export function setupPrint() {
  const sheet = document.querySelector<HTMLElement>('[data-print-sheet]');
  if (!sheet) return;

  const fit = () => fitToPage(sheet);
  // Fit as soon as the web fonts are in, and again right before printing (also covers Ctrl/Cmd+P).
  document.fonts.ready.then(fit);
  window.addEventListener('beforeprint', fit);

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-print]')) {
    button.addEventListener('click', async () => {
      await document.fonts.ready;
      fit();
      window.print();
    });
  }
}
