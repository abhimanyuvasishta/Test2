import type { DialogueLine, ProductionPlan } from "./schema";

export interface CaptionCue {
  index: number;
  startSec: number;
  endSec: number;
  speaker: string;
  text: string;
}

function pad(n: number, width: number): string {
  return n.toString().padStart(width, "0");
}

export function formatSrtTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(millis, 3)}`;
}

export function collectDialogue(plan: ProductionPlan): DialogueLine[] {
  return plan.scenes.flatMap((scene) => scene.dialogue);
}

export function estimateLineDurationSec(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1.4, Math.round((words / 2.6) * 10) / 10);
}

export function buildCaptionCues(plan: ProductionPlan, totalAudioSec?: number): CaptionCue[] {
  const lines = collectDialogue(plan);
  if (!lines.length) return [];

  const rawDurations = lines.map((line) => estimateLineDurationSec(line.text));
  const rawTotal = rawDurations.reduce((sum, value) => sum + value, 0);
  const target = totalAudioSec && totalAudioSec > 0 ? totalAudioSec : rawTotal;
  const factor = rawTotal > 0 ? target / rawTotal : 1;

  let cursor = 0;
  return lines.map((line, index) => {
    const duration = Math.max(0.8, rawDurations[index] * factor);
    const startSec = cursor;
    const endSec = cursor + duration;
    cursor = endSec;
    return {
      index: index + 1,
      startSec,
      endSec,
      speaker: line.characterName,
      text: line.text,
    };
  });
}

export function cuesToSrt(cues: CaptionCue[]): string {
  return cues
    .map(
      (cue) =>
        `${cue.index}\n${formatSrtTime(cue.startSec)} --> ${formatSrtTime(cue.endSec)}\n${cue.speaker}: ${cue.text}\n`
    )
    .join("\n");
}

export function buildSrt(plan: ProductionPlan, totalAudioSec?: number): string {
  return cuesToSrt(buildCaptionCues(plan, totalAudioSec));
}
