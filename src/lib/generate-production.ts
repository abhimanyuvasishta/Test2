import { generateNextEpisode, generateTemplateProduction } from "./template-director";
import type { CommandInput, EpisodeOutline, Production, ProductionBible } from "@/types";

export async function generateProduction(
  input: CommandInput,
  episodeNumber = 1
): Promise<Production> {
  try {
    const response = await fetch("/api/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, episodeNumber }),
    });
    if (response.ok) {
      const result = (await response.json()) as Production;
      if (result?.episode?.shots?.length) return result;
    }
  } catch {
    // Static hosts and offline preview use the on-device director.
  }
  return generateTemplateProduction(input, episodeNumber);
}

export function localNextEpisode(
  input: CommandInput,
  bible: ProductionBible,
  nextNumber: number,
  plan: EpisodeOutline[]
): Production {
  return generateNextEpisode(input, bible, nextNumber, plan);
}
