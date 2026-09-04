import { parsePalette, type SeriesBible } from "@/lib/production/schema";
import type { Character, Product, Series } from "@prisma/client";

type SeriesWithRelations = Series & { characters: Character[]; products: Product[] };

export function toBible(series: SeriesWithRelations): SeriesBible {
  return {
    id: series.id,
    name: series.name,
    niche: series.niche,
    stylePrompt: series.stylePrompt,
    aspectRatio: series.aspectRatio === "16:9" ? "16:9" : "9:16",
    voiceId: series.voiceId,
    palette: parsePalette(series.palette),
    characters: series.characters.map((character) => ({
      id: character.id,
      name: character.name,
      role: character.role,
      personality: character.personality,
      lookPrompt: character.lookPrompt,
      voiceId: character.voiceId,
    })),
    products: series.products.map((product) => ({
      id: product.id,
      name: product.name,
      lookPrompt: product.lookPrompt,
      mustShowBeats: safeJsonArray(product.mustShowBeats),
    })),
  };
}

function safeJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
