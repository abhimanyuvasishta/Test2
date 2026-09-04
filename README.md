# AI Video Creator

Command-driven series studio: lock a world bible (characters, products, style), type an episode command, get a **production JSON** plus a **~60s MP4** with TTS, captions, and FFmpeg.

This is the first slice of a Faceless-style pipeline. It does **not** generate cinematic AI video yet. It does produce a real, reviewable episode file from a structured plan so you can iterate on the showrunner loop.

## What you can do now

1. Open the series studio and use the seeded **Midnight Pour** bible (Maya, Leo, Ember Mug).
2. Type a command such as `Leo hates his old mug. Maya shows the Ember Mug. 60 seconds.`
3. The planner writes a shot list with dialogue and must-show product beats.
4. The renderer speaks the lines (espeak-ng when installed, otherwise timed silence), burns captions, and muxes a 9:16 MP4.

The older canvas **executive demo** studio still lives at `/executive`.

## Quick start

```bash
npm install
cp .env.example .env   # DATABASE_URL is enough for the local pipeline
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Optional:

```bash
sudo apt-get install -y espeak-ng   # local voices
npm test                            # planner + caption tests
npm run render:sample               # CLI render into storage/sample-render
```

`OPENAI_API_KEY` still powers the executive-studio script writer. The series planner currently uses a deterministic bible-aware template so you can ship without a key. Swap in an LLM behind the same Zod schema next.

## Pipeline

```
command + series bible
  → production JSON (scenes, dialogue, product beats)
  → per-line TTS
  → SRT captions
  → scene stills (FFmpeg title cards)
  → H.264 MP4 with burned-in captions
```

Data lives in SQLite (`prisma/dev.db`). Renders are written to `storage/episodes/` and copied to `public/renders/` for playback.

## GitHub Pages

The static export at `/docs` can show the executive canvas studio. The series pipeline needs Node, FFmpeg, and SQLite, so it will not run on Pages.

## License

MIT
