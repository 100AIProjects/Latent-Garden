/* src/content/config.ts */
import { defineCollection, z } from 'astro:content';

const gardenCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // 1. Identity
    title: z.string(),
    // FIX: Use coerce to handle "2025-01-24" strings safely
    date: z.coerce.date(),

    // FIX: Make 'type' optional with a default for legacy files
    type: z.enum(['project', 'fragment']).default('project'),

    // 2. Hierarchy
    id: z.string().optional(),
    parent: z.string().optional(),

    // 3. Metadata
    // FIX: Allow any case in markdown, but validate against lowercase enum
    status: z.string().transform(str => str.toLowerCase()).pipe(
      z.enum(['seedling', 'sapling', 'evergreen', 'compost'])
    ).default('seedling'),

    description: z.string(),

    // 4. Connections
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),

    // 5. Project Mapping (for telemetry sync)
    project_id: z.string().optional(),
    project_aliases: z.array(z.string()).default([]),

    slug: z.string().optional() // Sometimes Astro needs this explicit
  })
});

export const collections = {
  'garden': gardenCollection,
};