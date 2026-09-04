import { prisma } from "@/lib/db";

const SAMPLE_COMMAND =
  "Episode 1: Leo hates his old mug. Maya shows the Ember Mug. Keep it 60 seconds, vertical, same cafe world.";

export async function ensureSeeded(): Promise<void> {
  const count = await prisma.series.count();
  if (count > 0) return;

  await prisma.series.create({
    data: {
      name: "Midnight Pour",
      niche: "faceless coffee brand series",
      stylePrompt:
        "2.5D illustrated cafe, warm amber light, muted greens, clean linework, no photorealism, locked wardrobe, locked mug silhouette",
      aspectRatio: "9:16",
      voiceId: "narrator",
      palette: "#f59e0b,#1a1208,#fff7ed",
      characters: {
        create: [
          {
            name: "Maya",
            role: "barista",
            personality: "Warm, direct, a little sarcastic. Protects the product story.",
            lookPrompt: "South Asian woman, 30s, dark bun, rust apron, gold hoop, neutral cafe portrait",
            voiceId: "lead",
          },
          {
            name: "Leo",
            role: "skeptical regular",
            personality: "Dry, impatient, converts only with proof.",
            lookPrompt: "East Asian man, 30s, black beanie, grey hoodie, arms crossed, same cafe lighting",
            voiceId: "support",
          },
        ],
      },
      products: {
        create: [
          {
            name: "Ember Mug",
            lookPrompt: "Matte charcoal ceramic mug, ember-orange interior, small E mark, no extra logos",
            mustShowBeats: JSON.stringify(["hero packshot", "in-hand", "logo close-up"]),
          },
        ],
      },
    },
  });
}

export const sampleCommand = SAMPLE_COMMAND;
