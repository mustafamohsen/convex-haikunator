import {
  applyDefaults,
  fnv1a32,
  mulberry32,
  generateHaikuName,
  seededPreview,
  randomGenerate,
  bulkSeeded,
  bulkRandom,
  defaultAdjectives,
  defaultNouns,
  type Config,
} from "../src/index";

function combos(
  adjectives: readonly string[],
  nouns: readonly string[],
  opts?: Pick<Config, "tokenLength" | "tokenHex" | "tokenChars">
) {
  const tokenLen = opts?.tokenLength ?? 0;
  const tokenChars =
    opts?.tokenHex === true ? "0123456789abcdef" : (opts?.tokenChars ?? "0123456789");
  const pow = tokenLen > 0 ? Math.pow(tokenChars.length, tokenLen) : 1;
  return adjectives.length * nouns.length * pow;
}

describe("applyDefaults", () => {
  it("merges with target overriding defaults", () => {
    const defaults = { delimiter: "-", tokenLength: 4, tokenHex: false, tokenChars: "0123456789" };
    const target = { tokenLength: 6, tokenHex: true };
    const out = applyDefaults(target, defaults);
    expect(out.delimiter).toBe("-");
    expect(out.tokenLength).toBe(6);
    expect(out.tokenHex).toBe(true);
    expect(out.tokenChars).toBe("0123456789"); // will be overridden later by tokenHex in generator
  });
});

describe("fnv1a32", () => {
  it("is deterministic", () => {
    const a = fnv1a32("hello");
    const b = fnv1a32("hello");
    expect(a).toBe(b);
  });
  it("differs for different inputs (sanity)", () => {
    const a = fnv1a32("hello");
    const b = fnv1a32("world");
    expect(a).not.toBe(b);
  });
});

describe("mulberry32", () => {
  it("produces deterministic sequences", () => {
    const r1 = mulberry32(123);
    const r2 = mulberry32(123);
    const seq1 = [r1(), r1(), r1(), r1(), r1()];
    const seq2 = [r2(), r2(), r2(), r2(), r2()];
    expect(seq1).toEqual(seq2);
    seq1.forEach((x) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    });
  });
});

describe("generateHaikuName", () => {
  it("respects delimiter and token length", () => {
    const rng = mulberry32(42);
    const out = generateHaikuName({
      adjectives: ["brave"],
      nouns: ["fox"],
      defaults: { delimiter: "_", tokenLength: 3, tokenHex: false, tokenChars: "0123456789" },
      rng,
    });
    expect(out.name.split("_")[0]).toBe("brave");
    expect(out.name.split("_")[1]).toBe("fox");
    expect(out.name.split("_")[2]).toMatch(/^\d{3}$/);
  });

  it("with tokenLength = 0 has no trailing delimiter", () => {
    const rng = mulberry32(7);
    const out = generateHaikuName({
      adjectives: ["calm"],
      nouns: ["lake"],
      defaults: { delimiter: "-", tokenLength: 0, tokenHex: false, tokenChars: "0123456789" },
      rng,
    });
    expect(out.name).toBe("calm-lake");
  });

  it("tokenHex=true overrides tokenChars", () => {
    const rng = mulberry32(99);
    const out = generateHaikuName({
      adjectives: ["green"],
      nouns: ["hill"],
      defaults: { delimiter: "-", tokenLength: 6, tokenHex: false, tokenChars: "xyz" },
      options: { tokenHex: true, tokenLength: 6 }, // override
      rng,
    });
    const token = out.parts.token;
    expect(token).toMatch(/^[0-9a-f]{6}$/);
  });
});

describe("seededPreview", () => {
  it("is deterministic for same seed and args", () => {
    const a = seededPreview("seed-1", { options: { tokenLength: 4, tokenHex: true } });
    const b = seededPreview("seed-1", { options: { tokenLength: 4, tokenHex: true } });
    expect(a.name).toBe(b.name);
    expect(a.parts).toEqual(b.parts);
  });

  it("differs with different seeds", () => {
    const a = seededPreview("s1", { options: { tokenLength: 4 } });
    const b = seededPreview("s2", { options: { tokenLength: 4 } });
    expect(a.name).not.toBe(b.name);
  });
});

describe("randomGenerate", () => {
  it("returns expected shape", async () => {
    const r = await randomGenerate({ options: { tokenLength: 5 } });
    expect(r).toHaveProperty("name");
    expect(r.parts.token).toHaveLength(5);
  });

  it("respects tokenHex", async () => {
    const r = await randomGenerate({ options: { tokenLength: 4, tokenHex: true } });
    expect(r.parts.token).toMatch(/^[0-9a-f]{4}$/);
  });
});

describe("bulkSeeded", () => {
  it("returns unique names of the requested count", () => {
    const names = bulkSeeded("batch-seed", 10, { options: { tokenLength: 2 } });
    expect(names).toHaveLength(10);
    expect(new Set(names).size).toBe(10);
  });

  it("is deterministic for the same seed+args", () => {
    const a = bulkSeeded("det-seed", 5, { options: { tokenLength: 1 } });
    const b = bulkSeeded("det-seed", 5, { options: { tokenLength: 1 } });
    expect(a).toEqual(b);
  });

  it("throws when count exceeds possible combinations (strict)", () => {
    const opts: Config = { tokenLength: 0 };
    const total = combos(defaultAdjectives, defaultNouns, opts);
    expect(() => bulkSeeded("overflow", total + 1, { options: opts })).toThrow();
  });
});

describe("bulkRandom", () => {
  it("returns unique names of the requested count", async () => {
    const names = await bulkRandom(12, { options: { tokenLength: 2 } });
    expect(names).toHaveLength(12);
    expect(new Set(names).size).toBe(12);
  });

  it("throws when count exceeds possible combinations (strict)", async () => {
    const opts: Config = { tokenLength: 0 };
    const total = combos(defaultAdjectives, defaultNouns, opts);
    await expect(bulkRandom(total + 1, { options: opts })).rejects.toThrow();
  });
});
