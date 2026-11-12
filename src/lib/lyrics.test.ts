import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alignmentIssues, firstLine, hasTranslation, parseLyrics } from './lyrics.ts';

const PT = `Eu tava lá na Bahia
> Eh Bahia


Berimbau por que me chama  x2
Digue, digue, dom`;

test('parses stanzas, coro lines and repeats', () => {
  const stanzas = parseLyrics(PT);
  assert.equal(stanzas.length, 2, 'multiple blank lines are one stanza break');
  assert.deepEqual(stanzas[0][1], { pt: 'Eh Bahia', coro: true, repeat: undefined, he: undefined });
  assert.deepEqual(stanzas[1][0], { pt: 'Berimbau por que me chama', coro: false, repeat: 2, he: undefined });
  assert.equal(hasTranslation(stanzas), false);
});

test('zips translation line for line, honouring ~ and ignoring markers', () => {
  const he = `הייתי שם בבאהיה
> אה באהיה

ברימבאו, למה אתה קורא לי x2
~`;
  assert.deepEqual(alignmentIssues(PT, he), []);
  const stanzas = parseLyrics(PT, he);
  assert.equal(stanzas[0][1].he, 'אה באהיה');
  assert.equal(stanzas[1][0].he, 'ברימבאו, למה אתה קורא לי');
  assert.equal(stanzas[1][1].he, undefined, '~ means untranslated');
  assert.equal(hasTranslation(stanzas), true);
});

test('reports misaligned translations', () => {
  assert.deepEqual(alignmentIssues(PT, 'שורה אחת\n\nשתיים'), [
    'stanza 1 ("Eu tava lá na Bahia"): lyrics have 2 lines but translation has 1',
    'stanza 2 ("Berimbau por que me chama"): lyrics have 2 lines but translation has 1',
  ]);
  assert.match(alignmentIssues(PT, 'a\nb')[0], /1 stanzas but lyrics have 2/);
  assert.deepEqual(alignmentIssues(PT, '   '), [], 'blank translation = no translation');
});

test('firstLine skips leading blank lines and markers', () => {
  assert.equal(firstLine('\n\n> Aruanda ê\nx'), 'Aruanda ê');
});
