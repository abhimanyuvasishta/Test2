import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DialogueLine } from "./schema";
import { estimateLineDurationSec } from "./captions";

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(-800)}`));
    });
  });
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await run("which", [command]);
    return true;
  } catch {
    return false;
  }
}

async function ffmpegSilence(outPath: string, durationSec: number): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=22050:cl=mono`,
    "-t",
    durationSec.toFixed(2),
    "-c:a",
    "pcm_s16le",
    outPath,
  ]);
}

async function speakEspeak(text: string, outPath: string, voiceId: string): Promise<void> {
  const voice = voiceId === "support" ? "en-us+f3" : "en-us+m3";
  const pitch = voiceId === "support" ? "60" : "35";
  await run("espeak-ng", ["-v", voice, "-s", "145", "-p", pitch, "-w", outPath, text]);
}

export interface TtsResult {
  audioPath: string;
  durationSec: number;
  engine: "espeak-ng" | "silence";
}

export async function synthesizeDialogue(options: {
  lines: DialogueLine[];
  workDir: string;
  defaultVoiceId: string;
}): Promise<TtsResult> {
  const { lines, workDir } = options;
  await mkdir(workDir, { recursive: true });
  const hasEspeak = await commandExists("espeak-ng");
  const parts: string[] = [];

  for (const [index, line] of lines.entries()) {
    const partPath = path.join(workDir, `line-${String(index).padStart(3, "0")}.wav`);
    if (hasEspeak) {
      const voice = /maya|lead/i.test(line.characterName) ? "lead" : "support";
      await speakEspeak(line.text, partPath, voice);
    } else {
      await ffmpegSilence(partPath, estimateLineDurationSec(line.text));
    }
    parts.push(partPath);
  }

  if (!parts.length) {
    const empty = path.join(workDir, "voice.wav");
    await ffmpegSilence(empty, 16);
    return { audioPath: empty, durationSec: 16, engine: hasEspeak ? "espeak-ng" : "silence" };
  }

  const listPath = path.join(workDir, "audio-concat.txt");
  const listBody = parts.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(listPath, listBody, "utf8");

  const audioPath = path.join(workDir, "voice.wav");
  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c",
    "copy",
    audioPath,
  ]);

  return {
    audioPath,
    durationSec: lines.reduce((sum, line) => sum + estimateLineDurationSec(line.text), 0),
    engine: hasEspeak ? "espeak-ng" : "silence",
  };
}
