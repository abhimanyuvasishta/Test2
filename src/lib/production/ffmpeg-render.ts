import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProductionPlan } from "./schema";
import { dimensions } from "./scene-frames";

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1500)}`));
    });
  });
}

export async function assembleEpisode(options: {
  plan: ProductionPlan;
  frames: string[];
  audioPath: string;
  srtPath: string;
  outPath: string;
}): Promise<void> {
  const { plan, frames, audioPath, srtPath, outPath } = options;
  const workDir = path.dirname(outPath);
  await mkdir(workDir, { recursive: true });

  const concatPath = path.join(workDir, "concat.txt");
  const lines: string[] = [];
  plan.scenes.forEach((scene, index) => {
    const file = frames[index];
    if (!file) return;
    const escaped = file.replace(/'/g, "'\\''");
    lines.push(`file '${escaped}'`);
    lines.push(`duration ${scene.durationSec}`);
  });
  if (frames.length) {
    lines.push(`file '${frames[frames.length - 1].replace(/'/g, "'\\''")}'`);
  }
  await writeFile(concatPath, `${lines.join("\n")}\n`, "utf8");

  const { width, height } = dimensions(plan.aspectRatio);
  const srtEscaped = srtPath.replace(/\\/g, "/").replace(/'/g, "\\'");
  const vf = `subtitles='${srtEscaped}':force_style='FontName=Inter,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Alignment=2,MarginV=80'`;

  await run([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-i",
    audioPath,
    "-vf",
    vf,
    "-shortest",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-s",
    `${width}x${height}`,
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outPath,
  ]);
}
