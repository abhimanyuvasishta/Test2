# Client Video Studio

Turn client product inputs into cinematic, boardroom-ready demo films for CEOs, CTOs, and marketing heads.

Production URL: https://abhimanyuvasishta.github.io/Test2

## What it does

1. **Client brief** — Capture client, product, industry, brand color, the problem to call out, desired outcome, optional customer quote, audience (CEO / CTO / marketing / mixed), tone, CTA, and up to 12 product callouts with metrics.
2. **Director script** — Builds a scene-by-scene film (opening, stakes, each callout, proof, ask, close) with voiceover. Uses GPT-4o when `OPENAI_API_KEY` is set; otherwise the on-device director engine.
3. **Film studio** — Preview the 1080p motion-graphics film in the browser and export WebM with a cinematic score.

The app is a Next.js app that also exports as a static GitHub Pages site. Static hosting uses the director engine (no API).

## Quick start

`package.json` lives in the **Test2 repo folder**, not in your home directory. If npm reports `ENOENT` for `/Users/<you>/package.json`, you ran the command from the wrong folder.

```bash
# clone if you do not have the repo yet
git clone https://github.com/abhimanyuvasishta/Test2.git
cd Test2

# use the film-studio branch, then install from this folder
git checkout cursor/executive-ai-video-studio-6b98
npm install
cp .env.example .env.local   # optional, for GPT scripts
npm run dev
```

Confirm you are in the right place first:

```bash
pwd          # should end with /Test2
ls           # should list package.json, src/, README.md
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
