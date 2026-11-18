interface SearchItem {
  dataset: { creationTime?: string };
}

export function sortNewestFirst<T extends SearchItem>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => Date.parse(b.dataset.creationTime ?? '') - Date.parse(a.dataset.creationTime ?? ''),
  );
}
