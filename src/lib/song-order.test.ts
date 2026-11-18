import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortNewestFirst } from './song-order.ts';

test('sortNewestFirst orders songs by creation time without changing the source list', () => {
  const oldest = { dataset: { creationTime: '2026-11-16T12:00:00Z' } };
  const newest = { dataset: { creationTime: '2026-11-18T12:00:00Z' } };
  const middle = { dataset: { creationTime: '2026-11-17T12:00:00Z' } };
  const songs = [oldest, newest, middle];

  assert.deepEqual(sortNewestFirst(songs), [newest, middle, oldest]);
  assert.deepEqual(songs, [oldest, newest, middle]);
});
