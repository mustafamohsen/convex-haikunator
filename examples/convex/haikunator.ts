// File: convex/haikunator.ts
// Drop-in Convex handlers built on top of `convex-haikunator` library.
import { query, action } from "./_generated/server";
import { v } from "convex/values";

import {
  seededPreview,
  randomGenerate,
  type Config,
} from "convex-haikunator";

const configSchema = v.object({
  delimiter: v.optional(v.string()),
  tokenLength: v.optional(v.number()),
  tokenHex: v.optional(v.boolean()),
  tokenChars: v.optional(v.string()),
});

export const preview = query({
  args: {
    seed: v.string(),
    adjectives: v.optional(v.array(v.string())),
    nouns: v.optional(v.array(v.string())),
    defaults: v.optional(configSchema),
    options: v.optional(configSchema),
  },
  handler: async (_ctx, args) => {
    const { name, parts } = seededPreview(args.seed, {
      adjectives: args.adjectives,
      nouns: args.nouns,
      defaults: args.defaults as Config | undefined,
      options: args.options as Config | undefined,
    });
    return { name, parts };
  },
});

export const generate = action({
  args: {
    adjectives: v.optional(v.array(v.string())),
    nouns: v.optional(v.array(v.string())),
    defaults: v.optional(configSchema),
    options: v.optional(configSchema),
  },
  handler: async (_ctx, args) => {
    const { name, parts } = await randomGenerate({
      adjectives: args.adjectives,
      nouns: args.nouns,
      defaults: args.defaults as Config | undefined,
      options: args.options as Config | undefined,
    });
    return { name, parts };
  },
});

export const haikunator = { preview, generate };
export type { Config } from "convex-haikunator";
