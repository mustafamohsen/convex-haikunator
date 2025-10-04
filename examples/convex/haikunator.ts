import { v } from "convex/values";
import { action, query } from "./_generated/server";

function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function randomElement<T>(arr: T[]): T {
  return arr[secureRandomInt(arr.length)];
}

function randomGenerate(options: { delimiter?: string; tokenLength?: number; tokenHex?: boolean }) {
  const adjectives = ["autumn", "hidden", "bitter", "misty"];
  const nouns = ["waterfall", "river", "breeze", "moon"];

  const delimiter = options.delimiter ?? "-";
  const tokenLength = options.tokenLength ?? 4;
  const tokenHex = options.tokenHex ?? false;

  const adjective = randomElement(adjectives);
  const noun = randomElement(nouns);

  let token = "";
  if (tokenLength > 0) {
    if (tokenHex) {
      for (let i = 0; i < tokenLength; i++) {
        token += secureRandomInt(16).toString(16);
      }
    } else {
      for (let i = 0; i < tokenLength; i++) {
        token += secureRandomInt(10).toString();
      }
    }
  }

  return { name: `${adjective}${delimiter}${noun}${delimiter}${token}` };
}

export const generate = action({
  args: {
    options: v.optional(
      v.object({
        delimiter: v.optional(v.string()),
        tokenLength: v.optional(v.number()),
        tokenHex: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (_, { options }) => {
    return randomGenerate(options ?? {});
  },
});

export const bulkRandom = action({
  args: {
    count: v.number(),
    options: v.optional(
      v.object({
        delimiter: v.optional(v.string()),
        tokenLength: v.optional(v.number()),
        tokenHex: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (_, { count, options }) => {
    const names = Array.from({ length: count }, () => randomGenerate(options ?? {}));
    return { names };
  },
});

export const preview = query({
  args: {
    seed: v.string(),
    options: v.optional(
      v.object({
        delimiter: v.optional(v.string()),
        tokenLength: v.optional(v.number()),
        tokenHex: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (_, { seed, options }) => {
    return { name: `preview-${seed}` };
  },
});
