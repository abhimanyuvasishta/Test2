import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectDialogue, buildSrt } from "./captions";
import { assembleEpisode } from "./ffmpeg-render";
import { planEpisodeFromBible } from "./planner";
import { renderAllSceneFrames } from "./scene-frames";
import type { ProductionPlan, SeriesBible } from "./schema";
import { scalePlanToRuntime } from "./schema";
import { synthesizeDialogue } from "./tts";

export interface RenderResult {
  plan: ProductionPlan;
  outputPath: string;
  captionsPath: string;
  audioPath: string;
  ttsEngine: string;
}

export async function planAndRenderEpisode(options: {
  bible: SeriesBible;
  command: string;
  episodeNumber: number;
  workDir: string;
}): Promise<RenderResult> {
  const { bible, command, episodeNumber, workDir } = options;
  await mkdir(workDir, { recursive: true });

  let plan = planEpisodeFromBible(bible, command, episodeNumber);
  const frames = await renderAllSceneFrames(plan, path.join(workDir, "frames"));
  const tts = await synthesizeDialogue({
    lines: collectDialogue(plan),
    workDir: path.join(workDir, "audio"),
    defaultVoiceId: bible.voiceId,
  });

  plan = scalePlanToRuntime(plan, Math.min(90, Math.max(15, tts.durationSec)));
  const captionsPath = path.join(workDir, "captions.srt");
  await writeFile(captionsPath, buildSrt(plan, tts.durationSec), "utf8");

  const outputPath = path.join(workDir, "episode.mp4");
  await assembleEpisode({
    plan,
    frames,
    audioPath: tts.audioPath,
    srtPath: captionsPath,
    outPath: outputPath,
  });

  await writeFile(path.join(workDir, "production.json"), JSON.stringify(plan, null, 2), "utf8");

  return {
    plan,
    outputPath,
    captionsPath,
    audioPath: tts.audioPath,
    ttsEngine: tts.engine,
  };
}
