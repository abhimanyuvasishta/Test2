# Client Video Studio

Turn client product inputs into cinematic, boardroom-ready demo films for CEOs, CTOs, and marketing heads.

Production URL: https://abhimanyuvasishta.github.io/Test2

## What it does

1. **Client brief** — Capture client, product, industry, brand color, the problem to call out, desired outcome, optional customer quote, audience (CEO / CTO / marketing / mixed), tone, CTA, and up to 12 product callouts with metrics.
2. **Director script** — Builds a scene-by-scene film (opening, stakes, each callout, proof, ask, close) with voiceover. Uses GPT-4o when `OPENAI_API_KEY` is set; otherwise the on-device director engine.
3. **Film studio** — Preview the 1080p motion-graphics film in the browser and export WebM with a cinematic score.

The app is a Next.js app that also exports as a static GitHub Pages site. Static hosting uses the director engine (no API).

## Quick start

```bash
npm install
cp .env.example .env.local   # optional, for GPT scripts
npm run dev
```

Open http://localhost:3000

```bash
npm test
npm run build:pages
```

## GitHub Pages

```bash
npm run build:pages
```

Writes `docs/` and copies `index.html` / `_next/` to the repo root. Enable Pages from GitHub Actions or publish the `master` branch.

## Tech

Next.js 14, TypeScript, Tailwind, Canvas + MediaRecorder, optional OpenAI.
