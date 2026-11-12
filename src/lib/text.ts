/** Lowercase and strip accents and punctuation: "São Bento!" → "sao bento". Used for search and slugs. */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function slugify(s: string): string {
  return fold(s).replace(/\s+/g, '-');
}
