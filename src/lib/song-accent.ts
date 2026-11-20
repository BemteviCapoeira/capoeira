const ACCENTS = ['coral', 'turquoise', 'yellow', 'pink', 'lime', 'orange', 'sky'] as const;

export function chooseAccent(index: number, excludedColors: readonly string[] = []): string {
  const excluded = new Set(excludedColors);
  for (let offset = 0; offset < ACCENTS.length; offset++) {
    const color = ACCENTS[(index + offset) % ACCENTS.length];
    if (!excluded.has(color)) return `var(--${color})`;
  }
  throw new Error('No song-page accent is available for the song tags');
}
