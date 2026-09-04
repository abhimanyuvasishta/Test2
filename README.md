# Client Video Studio

AI-powered application for generating professional, executive-ready product demo videos from client inputs.

Built for agencies and product teams who need to create impactful demo videos for CEOs, CTOs, and marketing leaders.

## Features

- **Multi-input client brief** — Collect client name, product details, industry, and multiple product highlights with metrics
- **Audience targeting** — Tailor scripts for CEO, CTO, Marketing, or mixed C-suite audiences
- **AI script generation** — GPT-4o crafts cinematic scene-by-scene scripts (with smart template fallback)
- **Professional video renderer** — Canvas-based 1080p motion graphics with brand colors, animated typography, and scene transitions
- **Preview & export** — Play through scenes in-browser and export as WebM video

## Quick Start

```bash
# Install dependencies
npm install

# Optional: enable AI script generation
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local

# Start development server (binds 0.0.0.0:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The app also runs as a static site (no Node API required). Script generation falls back to the on-device template when `/api/generate` is unavailable.

## GitHub Pages

Production URL: https://abhimanyuvasishta.github.io/Test2

```bash
npm run build:pages
```

That writes a static export to `docs/` and to the repo root (`index.html`, `_next/`) so GitHub Pages can serve the video studio instead of the old CrossUI sample.

Enable Pages: **Settings → Pages → Deploy from GitHub Actions**, or publish the `master` branch root / `/docs` folder.

## Workflow

1. **Client Brief** — Enter client/product info and add product highlights (up to 8)
2. **AI Script** — Review the generated scene timeline with headlines, metrics, and production notes
3. **Video Studio** — Preview animated scenes and export a professional demo video

## AI Configuration

The app works out of the box with a smart template engine. For AI-powered scripts:

1. Copy `.env.example` to `.env.local`
2. Set `OPENAI_API_KEY` to your OpenAI API key
3. Optionally set `OPENAI_MODEL` (default: `gpt-4o`)

## Tech Stack

- **Next.js 14** — React framework with App Router
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Modern styling
- **OpenAI API** — AI script generation
- **Canvas + MediaRecorder** — Client-side video rendering and export

## Project Structure

```
src/
├── app/                  # Next.js pages and API routes
│   ├── api/generate/     # AI script generation endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/           # React UI components
│   ├── BriefForm.tsx     # Client input form
│   ├── ScriptPreview.tsx # Script review
│   └── VideoStudio.tsx   # Video preview & export
├── lib/                  # Core logic
│   ├── ai.ts             # OpenAI integration
│   ├── template-script.ts
│   ├── validation.ts
│   └── video-renderer.ts # Canvas video engine
└── types/                # TypeScript types
```

## License

MIT
