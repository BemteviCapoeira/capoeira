import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, slugify } from './text.ts';

test('fold strips accents, case and punctuation', () => {
  assert.equal(fold('São Bento!'), 'sao bento');
  assert.equal(fold('Tim, tim, tim lá vai viola'), 'tim tim tim la vai viola');
  assert.equal(fold('Aruanda Ê'), 'aruanda e');
  assert.equal(fold('Capoeira…'), 'capoeira');
  assert.equal(fold('קפואירה'), 'קפואירה');
});

test('slugify', () => {
  assert.equal(slugify('Quem vem lá - sou eu'), 'quem-vem-la-sou-eu');
  assert.equal(slugify('VIDA DE MARÉ'), 'vida-de-mare');
});
