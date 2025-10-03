# convex-haikunator

Heroku-style, human-friendly name generator tailored for **Convex** apps.
- Deterministic `preview` (safe for `useQuery`) and truly random `generate` (use `useAction`)
- No lodash, tiny footprint
- Exposes a pure generator so you can also use it outside Convex
- MIT licensed

**Inspiration:** This project is inspired by [Atrox/haikunatorjs](https://github.com/Atrox/haikunatorjs/).

## Quick start

You can either **copy the ready-made Convex server file** into your app, or **use the pure generator**.

### Option A — Drop-in Convex handlers (recommended)
Copy the example file into your Convex project:

```bash
# from your project root
curl -fsSL https://raw.githubusercontent.com/mustafamohsen/convex-haikunator/main/examples/convex/haikunator.ts \
  -o ./convex/haikunator.ts
```

Then call it from your React app:

```tsx
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function NamePreview() {
  const preview = useQuery(api.haikunator.preview, {
    seed: "my-seed-123",                 // required for deterministic queries
    defaults: { delimiter: "-", tokenLength: 4 },
    options: { tokenHex: true },
  });

  const generate = useAction(api.haikunator.generate);

  return (
    <div>
      <p>Preview: {preview?.name ?? "…"}</p>
      <button onClick={async () => {
        const res = await generate({ options: { tokenLength: 6 } });
        alert(res.name);
      }}>
        Generate (random)
      </button>
    </div>
  );
}
```

### Option B — Use the pure generator (outside Convex too)

```ts
import {
  seededPreview,
  randomGenerate,
  defaultAdjectives,
  defaultNouns,
  type Config,
} from "convex-haikunator";

const seed = "abc123";
const preview = seededPreview(seed, {
  defaults: { delimiter: "-", tokenLength: 4 },
  options: { tokenHex: true },
  adjectives: defaultAdjectives,
  nouns: defaultNouns,
});
console.log(preview.name);
```

## API

### Types

```ts
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
```

### Functions

- `seededPreview(seed: string, args: GenerateArgs)` → `{ name, parts }`  
  Deterministic; safe for Convex queries.

- `randomGenerate(args: GenerateArgs)` → `{ name, parts }`  
  Non-deterministic; uses crypto when available.

- `defaultAdjectives`, `defaultNouns`  
  Ready-made word lists.

## Convex handlers

See `examples/convex/haikunator.ts` — a drop-in `query`/`action` pair:
- `haikunator.preview` — deterministic (for `useQuery`)
- `haikunator.generate` — random (for `useAction`)

## License

MIT © 2025 Mustafa Mohsen

## Credits

- Inspired by: https://github.com/Atrox/haikunatorjs/
- Built for: https://convex.dev
