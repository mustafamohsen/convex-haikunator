/**
 * convex-haikunator
 * MIT © 2025 Mustafa Mohsen
 * Inspired by: https://github.com/Atrox/haikunatorjs/
 */

export type Config = {
  delimiter?: string;
  tokenLength?: number;
  tokenHex?: boolean;
  tokenChars?: string;
};

export interface GenerateArgs {
  adjectives?: string[];
  nouns?: string[];
  defaults?: Config;
  options?: Config;
}

/** lodash.defaults-like shallow merge */
export function applyDefaults<T extends object, U extends object>(
  target: T | undefined,
  defaults: U
): T & U {
  const result: any = { ...defaults };
  if (target) {
    for (const key of Object.keys(target)) {
      const val = (target as any)[key];
      if (val !== undefined) result[key] = val;
    }
  }
  return result;
}

/** Deterministic PRNG: FNV-1a hash -> mulberry32 */
export function fnv1a32(str: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, n: number): number {
  if (n <= 0) return 0;
  return Math.floor(rng() * n);
}

export const defaultAdjectives = [
  "aged","ancient","autumn","billowing","bitter","black","blue","bold",
  "broad","broken","calm","cold","cool","crimson","curly","damp",
  "dark","dawn","delicate","divine","dry","empty","falling","fancy",
  "flat","floral","fragrant","frosty","gentle","green","hidden","holy",
  "icy","jolly","late","lingering","little","lively","long","lucky",
  "misty","morning","muddy","mute","nameless","noisy","odd","old",
  "orange","patient","plain","polished","proud","purple","quiet","rapid",
  "raspy","red","restless","rough","round","royal","shiny","shrill",
  "shy","silent","small","snowy","soft","solitary","sparkling","spring",
  "square","steep","still","summer","super","sweet","throbbing","tight",
  "tiny","twilight","wandering","weathered","white","wild","winter","wispy",
  "withered","yellow","young"
] as const;

export const defaultNouns = [
  "art","band","bar","base","bird","block","boat","bonus",
  "bread","breeze","brook","bush","butterfly","cake","cell","cherry",
  "cloud","credit","darkness","dawn","dew","disk","dream","dust",
  "feather","field","fire","firefly","flower","fog","forest","frog",
  "frost","glade","glitter","grass","hall","hat","haze","heart",
  "hill","king","lab","lake","leaf","limit","math","meadow",
  "mode","moon","morning","mountain","mouse","mud","night","paper",
  "pine","poetry","pond","queen","rain","recipe","resonance","rice",
  "river","salad","scene","sea","shadow","shape","silence","sky",
  "smoke","snow","snowflake","sound","star","sun","sun","sunset",
  "surf","term","thunder","tooth","tree","truth","union","unit",
  "violet","voice","water","waterfall","wave","wildflower","wind","wood"
] as const;

const defaultOptions: Config = {
  delimiter: "-",
  tokenLength: 4,
  tokenHex: false,
  tokenChars: "0123456789",
};

export function generateHaikuName(args: {
  adjectives?: readonly string[];
  nouns?: readonly string[];
  defaults?: Config;
  options?: Config;
  rng: () => number;
}): { name: string; parts: { adjective: string; noun: string; token: string } } {
  const adjectives = (args.adjectives?.length ? args.adjectives : defaultAdjectives) as readonly string[];
  const nouns = (args.nouns?.length ? args.nouns : defaultNouns) as readonly string[];

  const base = applyDefaults(args.defaults, defaultOptions);
  const config = applyDefaults(args.options, base);

  if (config.tokenHex === true) {
    config.tokenChars = "0123456789abcdef";
  }

  const adjective = adjectives[randInt(args.rng, adjectives.length)];
  const noun = nouns[randInt(args.rng, nouns.length)];

  const tokenLen = config.tokenLength ?? 0;
  const tokenChars = config.tokenChars ?? "";
  let token = "";
  for (let i = 0; i < tokenLen; i++) {
    token += tokenChars[randInt(args.rng, tokenChars.length)] ?? "";
  }

  const name = [adjective, noun, token].filter(Boolean).join(config.delimiter ?? "-");
  return { name, parts: { adjective, noun, token } };
}

/** Deterministic preview: safe for Convex queries */
export function seededPreview(
  seed: string,
  args: GenerateArgs = {}
): { name: string; parts: { adjective: string; noun: string; token: string } } {
  const seedInt = fnv1a32(
    JSON.stringify({
      seed,
      adjectives: args.adjectives ?? null,
      nouns: args.nouns ?? null,
      defaults: args.defaults ?? null,
      options: args.options ?? null,
    })
  );
  const rng = mulberry32(seedInt);
  return generateHaikuName({
    adjectives: args.adjectives,
    nouns: args.nouns,
    defaults: args.defaults,
    options: args.options,
    rng,
  });
}

/** Non-deterministic generation: use in Convex actions or server code */
export async function randomGenerate(
  args: GenerateArgs = {}
): Promise<{ name: string; parts: { adjective: string; noun: string; token: string } }> {
  let seedInt: number;
  try {
    // Node env
    const { randomInt } = await import("node:crypto");
    seedInt = randomInt(0, 0xffffffff);
  } catch {
    // Browser fallback
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      const buf = new Uint32Array(1);
      (crypto as Crypto).getRandomValues(buf);
      seedInt = buf[0] >>> 0;
    } else {
      seedInt = Math.floor(Math.random() * 0xffffffff) >>> 0;
    }
  }
  const rng = mulberry32(seedInt);
  return generateHaikuName({
    adjectives: args.adjectives,
    nouns: args.nouns,
    defaults: args.defaults,
    options: args.options,
    rng,
  });
}
