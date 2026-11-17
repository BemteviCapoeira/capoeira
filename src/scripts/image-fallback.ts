export function initImageFallback(root: ParentNode = document): void {
  const applyFallback = (img: HTMLImageElement) => {
    if (img.dataset.fallbackApplied === 'true') return;
    img.dataset.fallbackApplied = 'true';
    img.src = `${document.body.dataset.base ?? '/'}logo-blue-bg.svg`;
    img.removeAttribute('srcset');
    img.classList.add('image-fallback');
    img.closest('picture')?.querySelectorAll('source').forEach((source) => source.remove());
  };

  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-image-fallback]')) {
    img.addEventListener('error', () => applyFallback(img), { once: true });
    if (img.complete && img.naturalWidth === 0) applyFallback(img);
  }
}
