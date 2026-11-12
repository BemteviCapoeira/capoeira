import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLyrics, parseYouTube, songMarkdown } from './song-file.ts';

test('parseYouTube accepts ids and common URLs', () => {
  assert.deepEqual(parseYouTube('msmBZpgMhBk'), { id: 'msmBZpgMhBk' });
  assert.deepEqual(parseYouTube('https://youtu.be/rOAriZH-Ot8?si=rDUVZ8kP7Qg_VgiK'), { id: 'rOAriZH-Ot8' });
  assert.deepEqual(parseYouTube('https://www.youtube.com/watch?v=qCd5pr60oMk&t=90'), { id: 'qCd5pr60oMk', start: 90 });
  assert.deepEqual(parseYouTube('youtube.com/watch?v=qCd5pr60oMk&t=1m30s'), { id: 'qCd5pr60oMk', start: 90 });
  assert.deepEqual(parseYouTube('https://m.youtube.com/shorts/qCd5pr60oMk'), { id: 'qCd5pr60oMk' });
  assert.deepEqual(parseYouTube('https://youtu.be/nozzYgE4ofY?t=12s'), { id: 'nozzYgE4ofY', start: 12 });
  assert.equal(parseYouTube('https://vimeo.com/123'), undefined);
  assert.equal(parseYouTube('not a link'), undefined);
});

test('normalizeLyrics tidies pasted text and turns indented lines into coro lines', () => {
  const pasted = '\n\nEu tava la na Bahia  \r\n    Eh Bahia\n\n\n\nBerimbau por que me chama  x2\n> Já marcado\n';
  assert.equal(normalizeLyrics(pasted), 'Eu tava la na Bahia\n> Eh Bahia\n\nBerimbau por que me chama x2\n> Já marcado');
});

test('songMarkdown writes valid frontmatter in the repo format', () => {
  const md = songMarkdown({
    titles: ['Paranauê', 'Paraná "ê"'],
    tags: ['sao-bento'],
    image: 'cover.jpg',
    imageAlt: 'תמונה',
    youtube: { id: 'qCd5pr60oMk', start: 30 },
    lyrics: 'Linha um\n  Coro\n\nLinha dois',
    translation: 'שורה אחת\nמקהלה\n\nשורה שתיים',
    notes: '  הערה  ',
  });
  assert.equal(
    md,
    [
      '---',
      'titles: ["Paranauê","Paraná \\"ê\\""]',
      'tags: [sao-bento]',
      'image: ./cover.jpg',
      'imageAlt: "תמונה"',
      'youtube: qCd5pr60oMk',
      'youtubeStart: 30',
      'lyrics: |',
      '  Linha um',
      '  > Coro',
      '',
      '  Linha dois',
      'translation: |',
      '  שורה אחת',
      '  מקהלה',
      '',
      '  שורה שתיים',
      '---',
      '',
      'הערה',
      '',
    ].join('\n'),
  );
  assert.equal(songMarkdown({ titles: ['X'], tags: [], lyrics: 'a' }), '---\ntitles: ["X"]\ntags: []\nlyrics: |\n  a\n---\n');
});
