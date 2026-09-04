import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { planAndRenderEpisode } from "../src/lib/production/run-episode";
import type { SeriesBible } from "../src/lib/production/schema";

const bible: SeriesBible = {
  id: "demo",
  name: "Midnight Pour",
  niche: "faceless coffee brand series",
  stylePrompt: "2.5D illustrated cafe, warm amber light, locked mug silhouette",
  aspectRatio: "9:16",
  voiceId: "narrator",
  palette: ["#f59e0b", "#1a1208", "#fff7ed"],
  characters: [
    {
      id: "maya",
      name: "Maya",
      role: "barista",
      personality: "Warm and direct",
      lookPrompt: "rust apron, gold hoop",
      voiceId: "lead",
    },
    {
      id: "leo",
      name: "Leo",
      role: "regular",
      personality: "Skeptical",
      lookPrompt: "grey hoodie",
      voiceId: "support",
    },
  ],
  products: [
    {
      id: "ember",
      name: "Ember Mug",
      lookPrompt: "matte charcoal mug",
      mustShowBeats: ["hero packshot", "in-hand", "logo close-up"],
    },
  ],
};

async function main() {
  const workDir = path.join(process.cwd(), "storage", "sample-render");
  await mkdir(workDir, { recursive: true });
  const result = await planAndRenderEpisode({
    bible,
    command: "Episode 1: Leo hates his old mug. Maya shows the Ember Mug. 60 seconds.",
    episodeNumber: 1,
    workDir,
  });
  await writeFile(path.join(workDir, "README.txt"), `Rendered with ${result.ttsEngine}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: result.outputPath, runtimeSec: result.plan.runtimeSec, engine: result.ttsEngine }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
