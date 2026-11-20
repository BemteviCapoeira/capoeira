import assert from 'node:assert/strict';
import test from 'node:test';
import { TAGS } from '../data/tags.ts';
import { chooseAccent } from './song-accent.ts';

test('song header accent skips the Benguela tag color', () => {
  assert.equal(chooseAccent(1, [TAGS.benguela.color]), 'var(--yellow)');
});

test('song header accent skips the Sao Bento tag color', () => {
  assert.equal(chooseAccent(0, [TAGS['sao-bento'].color]), 'var(--turquoise)');
});

test('song header accent skips both tag colors when both tags are present', () => {
  assert.equal(chooseAccent(0, [TAGS.benguela.color, TAGS['sao-bento'].color]), 'var(--yellow)');
});

test('song header accent keeps its regular color when it does not conflict', () => {
  assert.equal(chooseAccent(2, [TAGS.benguela.color]), 'var(--yellow)');
});
