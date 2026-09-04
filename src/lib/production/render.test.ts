import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { planAndRenderEpisode } from "./run-episode";
import type { SeriesBible } from "./schema";

const bible: SeriesBible = {
  id: "render-test",
  name: "Midnight Pour",
  niche: "coffee",
  stylePrompt: "2.5D cafe",
  aspectRatio: "9:16",
  voiceId: "narrator",
  palette: ["#f59e0b", "#1a1208"],
  characters: [
    {
      id: "maya",
      name: "Maya",
      role: "barista",
      personality: "warm",
      lookPrompt: "apron",
      voiceId: "lead",
    },
    {
      id: "leo",
      name: "Leo",
      role: "regular",
      personality: "dry",
      lookPrompt: "hoodie",
      voiceId: "support",
    },
  ],
  products: [
    {
      id: "ember",
      name: "Ember Mug",
      lookPrompt: "mug",
      mustShowBeats: ["hero packshot", "in-hand", "logo close-up"],
    },
  ],
};

describe("ffmpeg episode render", () => {
  it(
    "writes an mp4 and srt from a bible command",
    async () => {
      const workDir = await mkdtemp(path.join(os.tmpdir(), "episode-"));
      try {
        const result = await planAndRenderEpisode({
          bible,
          command: "Maya shows Leo the Ember Mug in 20 seconds.",
          episodeNumber: 1,
          workDir,
        });
        expect(result.outputPath.endsWith("episode.mp4")).toBe(true);
        expect(result.plan.scenes.length).toBeGreaterThan(3);
        const { statSync } = await import("node:fs");
        expect(statSync(result.outputPath).size).toBeGreaterThan(10_000);
        expect(statSync(result.captionsPath).size).toBeGreaterThan(40);
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    },
    120_000
  );
});
