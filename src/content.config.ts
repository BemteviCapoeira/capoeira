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
  schema: ({ image }) =>
    z
      .object({
        /** First = main title; the rest are other names the song is known by (all searchable). */
        titles: z.array(z.string().min(1)).min(1),
        tags: z.array(z.enum(TAG_IDS)).default([]),
        image: image().optional(),
        imageAlt: z.string().default(''),
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
        translation: z.string().optional(),
      })
      .superRefine((song, ctx) => {
        for (const message of alignmentIssues(song.lyrics, song.translation)) {
          ctx.addIssue({ code: 'custom', path: ['translation'], message });
        }
      }),
});

export const collections = { songs };
