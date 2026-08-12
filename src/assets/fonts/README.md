# Self-hosted fonts

Latin-subset variable `woff2` files for the two typefaces the SafeMeds Vital
design system specifies.

| File | Family | Axis range | Size | Used for |
|---|---|---|---|---|
| `Inter-Variable-latin.woff2` | Inter | 100–900 | 48 KB | Body, labels, UI |
| `Manrope-Variable-latin.woff2` | Manrope | 200–800 | 25 KB | Headlines, display |

## Why these are committed rather than fetched

`next/font/google` self-hosts the files it downloads, but it still needs network
access **at build time**. Commit `ba2725d` removed the Google Fonts dependency
specifically so the project could build offline, and reintroducing it would undo
that. Committing the files keeps both properties: the design system's typography
and a build that never reaches the network.

They are wired up with `next/font/local` in `src/app/layout.tsx`, which exposes
them as the `--font-inter` and `--font-manrope` CSS variables consumed by
`globals.css`.

## Licensing

Both families are released under the **SIL Open Font License 1.1**, which
permits redistribution and embedding, including bundled in an application.

- Inter — https://github.com/rsms/inter
- Manrope — https://github.com/sharanda/manrope

## Regenerating

These are the `latin` subsets served by Google Fonts. To refresh, request the
CSS with a modern browser user agent, take the `woff2` URL from the block
commented `/* latin */` for each family, and download it:

```bash
curl "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Manrope:wght@200..800&display=swap"
```

If you add a locale needing Cyrillic, Greek, or Vietnamese glyphs, pull those
subsets too and register them as additional `src` entries.
