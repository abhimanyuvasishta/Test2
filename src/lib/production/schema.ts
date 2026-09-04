import { z } from "zod";

export const aspectRatioSchema = z.enum(["9:16", "16:9"]);

export const dialogueLineSchema = z.object({
  characterId: z.string().min(1),
  characterName: z.string().min(1),
  text: z.string().min(1).max(280),
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["hook", "talking", "broll", "product", "title", "end_card"]),
  durationSec: z.number().min(1).max(20),
  location: z.string().min(1),
  onScreenText: z.string().min(1).max(120),
  action: z.string().min(1).max(400),
  productId: z.string().optional(),
  characterId: z.string().optional(),
  dialogue: z.array(dialogueLineSchema).default([]),
});

export const bibleCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  personality: z.string(),
  lookPrompt: z.string(),
  voiceId: z.string(),
});

export const bibleProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  lookPrompt: z.string(),
  mustShowBeats: z.array(z.string()),
});

export const seriesBibleSchema = z.object({
  id: z.string(),
  name: z.string(),
  niche: z.string(),
  stylePrompt: z.string(),
  aspectRatio: aspectRatioSchema,
  voiceId: z.string(),
  palette: z.array(z.string()),
  characters: z.array(bibleCharacterSchema),
  products: z.array(bibleProductSchema),
});

export const productionPlanSchema = z.object({
  version: z.literal(1),
  title: z.string().min(1),
  runtimeSec: z.number().min(15).max(90),
  aspectRatio: aspectRatioSchema,
  stylePrompt: z.string(),
  seriesId: z.string(),
  episodeNumber: z.number().int().positive(),
  command: z.string(),
  characters: z.array(bibleCharacterSchema),
  products: z.array(bibleProductSchema),
  scenes: z.array(sceneSchema).min(3).max(16),
});

export type AspectRatio = z.infer<typeof aspectRatioSchema>;
export type DialogueLine = z.infer<typeof dialogueLineSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type BibleCharacter = z.infer<typeof bibleCharacterSchema>;
export type BibleProduct = z.infer<typeof bibleProductSchema>;
export type SeriesBible = z.infer<typeof seriesBibleSchema>;
export type ProductionPlan = z.infer<typeof productionPlanSchema>;

export function parsePalette(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function scalePlanToRuntime(plan: ProductionPlan, targetSec: number): ProductionPlan {
  const current = plan.scenes.reduce((sum, scene) => sum + scene.durationSec, 0);
  if (current <= 0) return plan;
  const factor = targetSec / current;
  const scenes = plan.scenes.map((scene) => ({
    ...scene,
    durationSec: Math.max(1.5, Math.round(scene.durationSec * factor * 10) / 10),
  }));
  const runtimeSec = Math.round(scenes.reduce((sum, scene) => sum + scene.durationSec, 0) * 10) / 10;
  return { ...plan, scenes, runtimeSec };
}
