import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLyrics, parseYouTube, songMarkdown, updateSongMarkdown } from './song-file.ts';

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
    imageAltEn: 'A picture',
    youtube: { id: 'qCd5pr60oMk', start: 30 },
    lyrics: 'Linha um\n  Coro\n\nLinha dois',
    hebrew: 'שורה אחת\nמקהלה\n\nשורה שתיים',
    english: 'Line one\nChorus\n\nLine two',
    notesHebrew: '  הערה  ',
    notesEnglish: ' A note\r\n\nSecond paragraph ',
  });
  const creationTime = /^---\ncreation-time: "([^"]+)"\n/.exec(md)?.[1];
  assert.ok(creationTime);
  assert.equal(new Date(creationTime).toISOString(), creationTime);
  assert.equal(
    md.replace(/^---\ncreation-time: "[^"]+"\n/, '---\n'),
    [
      '---',
      'titles: ["Paranauê","Paraná \\"ê\\""]',
      'tags: [sao-bento]',
      'image: ./cover.jpg',
      'imageAlt: "תמונה"',
      'imageAltEn: "A picture"',
      'youtube: qCd5pr60oMk',
      'youtubeStart: 30',
      'lyrics: |',
      '  Linha um',
      '  > Coro',
      '',
      '  Linha dois',
      'hebrew: |',
      '  שורה אחת',
      '  מקהלה',
      '',
      '  שורה שתיים',
      'english: |',
      '  Line one',
      '  Chorus',
      '',
      '  Line two',
      'notesHebrew: |',
      '  הערה',
      'notesEnglish: |',
      '  A note',
      '',
      '  Second paragraph',
      '---',
      '',
    ].join('\n'),
  );
  const simple = songMarkdown({ titles: ['X'], tags: [], lyrics: 'a' });
  assert.match(simple, /^---\ncreation-time: "\d{4}-\d{2}-\d{2}T[^"]+Z"\ntitles:/);
  assert.equal(
    simple.replace(/^---\ncreation-time: "[^"]+"\n/, '---\n'),
    '---\ntitles: ["X"]\ntags: []\nlyrics: |\n  a\n---\n',
  );
});

test('updateSongMarkdown changes only fields that differ', () => {
  const original = [
    '---',
    'creation-time: "2026-11-16T02:57:31+02:00"',
    'titles: ["Old title"]',
    'tags: [benguela]',
    'imageWide: ./wide.jpg',
    'imageTall: ./tall.jpg',
    'lyrics: |',
    '  Old line',
    'notesHebrew: |',
    '  Old note',
    '---',
    '',
  ].join('\n');
  const before = {
    titles: ['Old title'],
    tags: ['benguela'],
    lyrics: 'Old line',
    notesHebrew: 'Old note',
  };
  const after = { ...before, titles: ['New title'] };

  const updated = updateSongMarkdown(original, before, after);
  assert.match(updated, /titles: \["New title"\]/);
  assert.match(updated, /creation-time: "2026-11-16T02:57:31\+02:00"/);
  assert.match(updated, /imageWide: \.\/wide\.jpg/);
  assert.match(updated, /imageTall: \.\/tall\.jpg/);
  assert.match(updated, /notesHebrew: \|/);
  assert.match(updated, /  Old note/);
});
