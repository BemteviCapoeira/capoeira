import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactPayload, isValidEmail, isValidPhone, validateContact, type ContactInput } from './contact.ts';

const EMPTY: ContactInput = {
  name: '',
  nickname: '',
  email: '',
  phone: '',
  topic: '',
  songName: '',
  youtube: '',
  tags: [],
  song: '',
  message: '',
};

const SENDER = { name: 'Dana Levi', nickname: 'Pimenta', email: 'dana@example.com' };

test('isValidEmail', () => {
  assert.ok(isValidEmail('dana@example.com'));
  assert.ok(isValidEmail(' dana.levi+capo@mail.co.il '));
  assert.ok(!isValidEmail('dana@example'));
  assert.ok(!isValidEmail('dana@.com'));
  assert.ok(!isValidEmail('dana example@mail.com'));
  assert.ok(!isValidEmail('@mail.com'));
  assert.ok(!isValidEmail('dana@mail.c'));
});

test('isValidPhone', () => {
  assert.ok(isValidPhone('050-1234567'));
  assert.ok(isValidPhone('+972 50 123 4567'));
  assert.ok(isValidPhone('(04) 637-1234'));
  assert.ok(!isValidPhone('12345'));
  assert.ok(!isValidPhone('call me'));
});

test('validateContact requires the sender and a topic', () => {
  assert.deepEqual(validateContact(EMPTY), { name: 'required', email: 'required', topic: 'required' });
  assert.deepEqual(validateContact({ ...EMPTY, ...SENDER, email: 'nope', phone: '12', topic: 'general', message: 'hi' }), {
    email: 'email',
    phone: 'phone',
  });
});

test('validateContact checks the fields of the chosen topic only', () => {
  assert.deepEqual(validateContact({ ...EMPTY, ...SENDER, topic: 'new-song', message: 'x' }), { songName: 'required' });
  assert.deepEqual(
    validateContact({ ...EMPTY, ...SENDER, topic: 'new-song', songName: 'Paranauê', youtube: 'vimeo.com/1', message: 'x' }),
    { youtube: 'youtube' },
  );
  assert.deepEqual(validateContact({ ...EMPTY, ...SENDER, topic: 'new-song', songName: 'Paranauê' }), {
    message: 'required',
  });
  assert.deepEqual(validateContact({ ...EMPTY, ...SENDER, topic: 'new-song', songName: 'Paranauê', message: 'x' }), {});
  assert.deepEqual(validateContact({ ...EMPTY, ...SENDER, topic: 'song-comment', songName: 'ignored' }), {
    song: 'required',
    message: 'required',
  });
  assert.deepEqual(validateContact({ ...EMPTY, ...SENDER, topic: 'general' }), { message: 'required' });
});

test('contactPayload sends only what applies to the topic', () => {
  const payload = contactPayload(
    { ...EMPTY, ...SENDER, topic: 'song-comment', song: 'paranaue', songName: 'leftover', message: ' Typo in line 2 ' },
    { song: { title: 'Paranauê', url: 'https://example.com/songs/paranaue/' }, language: 'he' },
  );
  assert.deepEqual(payload, {
    _subject: 'Capoeira songbook – Comment on a song: Paranauê – from Dana Levi (Pimenta)',
    _template: 'table',
    Topic: 'Comment on a song',
    Name: 'Dana Levi',
    Nickname: 'Pimenta',
    email: 'dana@example.com',
    Song: 'Paranauê',
    'Song page': 'https://example.com/songs/paranaue/',
    Message: 'Typo in line 2',
    'Site language': 'he',
  });

  const general = contactPayload({ ...EMPTY, name: 'Dana', email: 'd@x.io', topic: 'general', message: 'Hi' }, { language: 'en' });
  assert.equal(general._subject, 'Capoeira songbook – General comment – from Dana');
  assert.ok(!('Nickname' in general) && !('Phone' in general) && !('Song' in general) && !('Tags' in general));

  const newSong = contactPayload(
    { ...EMPTY, ...SENDER, topic: 'new-song', songName: 'Paranauê', tags: ['benguela', 'sao-bento'], message: 'We sang it' },
    { language: 'en' },
  );
  assert.equal(newSong.Tags, 'Benguela, São Bento');
  assert.ok(!('Tags' in contactPayload({ ...EMPTY, ...SENDER, topic: 'new-song', songName: 'X', message: 'y' }, { language: 'en' })));
});
