import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TAG_IDS } from './data/tags';
import { alignmentIssues } from './lib/lyrics';

const songs = defineCollection({
  // One folder per song: src/content/songs/<slug>/index.md (+ cover image). The folder name is the URL slug.
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/songs',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: () => {
    const imagePath = z.string().regex(/^\.\//, 'image paths must be relative to the song folder').optional();

    return z
      .object({
        'creation-time': z.iso.datetime({ offset: true }),
        /** First = main title; the rest are other names the song is known by (all searchable). */
        titles: z.array(z.string().min(1)).min(1),
        /** Omit this song from the home-page song list and its filters. */
        hidden: z.boolean().default(false),
        tags: z.array(z.enum(TAG_IDS)).default([]),
        /** The song's picture path, resolved at render time so a missing file can use the fallback. */
        image: imagePath,
        /** Crops of `image` for the two card layouts. The song page shows `image` itself. */
        imageWide: imagePath, // 4:3 — cards on wider screens (and link previews)
        imageTall: imagePath, // 4:5 — the thumbnail beside the title on phones
        /** Picture description for screen readers, in Hebrew (and in English). */
        imageAlt: z.string().default(''),
        imageAltEn: z.string().default(''),
        /** YouTube video id (the 11 characters after youtu.be/ or watch?v=). */
        youtube: z
          .string()
          .regex(/^[\w-]{11}$/, 'use the 11-character video id, not the full URL')
          .optional(),
        /** Start the video at this many seconds. */
        youtubeStart: z.number().int().positive().optional(),
        /** Portuguese lyrics — see src/lib/lyrics.ts for the format. */
        lyrics: z.string().min(1),
        /** Hebrew translation, line for line with `lyrics`. */
        hebrew: z.string().optional(),
        /** English translation, line for line with `lyrics`. */
        english: z.string().optional(),
        /** Notes about the song, shown in the Notes box (plain text; a blank line starts a new paragraph). */
        notesHebrew: z.string().optional(),
        notesEnglish: z.string().optional(),
      })
      .superRefine((song, ctx) => {
        for (const key of ['hebrew', 'english'] as const) {
          for (const message of alignmentIssues(song.lyrics, song[key])) {
            ctx.addIssue({ code: 'custom', path: [key], message });
          }
        }
      });
  },
});

export const collections = { songs };
