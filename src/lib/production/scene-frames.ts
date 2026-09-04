import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AspectRatio, ProductionPlan, Scene } from "./schema";

const FONT = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf";

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
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1200)}`));
    });
  });
}

export function dimensions(aspect: AspectRatio): { width: number; height: number } {
  return aspect === "16:9" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
}

function wrap(text: string, width: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 6).join("\n");
}

function sceneColor(scene: Scene, palette: string[]): string {
  const fallback = ["#f59e0b", "#1a1208", "#fff7ed"];
  const colors = palette.length ? palette : fallback;
  if (scene.type === "product") return "0x1a1208";
  if (scene.type === "hook") return "0x111827";
  if (scene.type === "end_card") return "0x0a0a0f";
  return colors[1]?.replace("#", "0x") || "0x1a1208";
}

export async function renderSceneFrame(options: {
  scene: Scene;
  plan: ProductionPlan;
  outPath: string;
}): Promise<void> {
  const { scene, plan, outPath } = options;
  const { width, height } = dimensions(plan.aspectRatio);
  const palette = plan.products.length ? ["#f59e0b", "#1a1208", "#fff7ed"] : ["#6366f1", "#0a0a0f", "#eef2ff"];
  const label = scene.type.toUpperCase().replace("_", " ");
  const body = wrap(scene.onScreenText, 28);
  const action = wrap(scene.action, 36);
  const textPath = `${outPath}.txt`;
  await writeFile(textPath, `${label}\n\n${body}\n\n${action}`, "utf8");

  const font = FONT.replace(/\\/g, "/").replace(/:/g, "\\:");
  const vf = [
    `drawtext=fontfile='${font}':textfile='${textPath.replace(/:/g, "\\:")}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=16:text_align=center`,
  ].join(",");

  await run([
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${sceneColor(scene, palette)}:s=${width}x${height}:d=0.04`,
    "-vf",
    vf,
    "-frames:v",
    "1",
    outPath,
  ]);
}

export async function renderAllSceneFrames(plan: ProductionPlan, workDir: string): Promise<string[]> {
  await mkdir(workDir, { recursive: true });
  const paths: string[] = [];
  for (const [index, scene] of plan.scenes.entries()) {
    const outPath = path.join(workDir, `scene-${String(index).padStart(2, "0")}.png`);
    await renderSceneFrame({ scene, plan, outPath });
    paths.push(outPath);
  }
  return paths;
}
