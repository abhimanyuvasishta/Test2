# Forge — AI Video Creator

Command-driven studio for faceless shorts, product films, character conversations, and animated series.

Give Forge a prompt. It writes a production bible (characters, product lock, mood), a timed shot list, kinetic captions, and a canvas-rendered video you can preview and export as WebM.

## Features

- **Command board** — natural-language ideas plus format, aspect ratio, and niche presets
- **Formats** — faceless narration, product film, multi-character conversation, animated series
- **Identity lock** — character sheets and product plates persist across shots and episodes
- **On-device director** — works without an API key; optional GPT-4o via `OPENAI_API_KEY`
- **Studio** — play with optional browser speech, scrub shots, export captioned WebM
- **Series library** — save a season in the browser and generate the next episode

## Quick start

```bash
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Workflow

1. **Command** — pick a preset or describe the video
2. **Bible** — review characters, product lock, shot list, season plan
3. **Studio** — play, then export WebM
4. **Series** — save and queue later episodes

## AI configuration

The director always has a template fallback. To use GPT-4o:

1. Copy `.env.example` to `.env.local`
2. Set `OPENAI_API_KEY`
3. Optionally set `OPENAI_MODEL` (default: `gpt-4o`)

## Tests

```bash
npm test
```

## GitHub Pages

```bash
npm run build:pages
```

Static export uses the on-device director (`/api/direct` is omitted).

## Stack

Next.js 14, TypeScript, Tailwind, Zod, Canvas + MediaRecorder, optional OpenAI JSON director.
