/**
 * The only tags songs may use (the content schema rejects anything else, so typos fail the build).
 * `color` is a palette name from src/styles/tokens.css.
 */
export const TAGS = {
  benguela: { label: 'Benguela', color: 'turquoise' },
  'sao-bento': { label: 'São Bento', color: 'coral' },
} as const satisfies Record<string, { label: string; color: string }>;

export type TagId = keyof typeof TAGS;

export const TAG_IDS = Object.keys(TAGS) as [TagId, ...TagId[]];
