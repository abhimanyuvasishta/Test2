import OpenAI from "openai";
import { estimateCredits } from "./formats";
import { generateTemplateProduction } from "./template-director";
import type { CommandInput, Production, Shot } from "@/types";

const SYSTEM_PROMPT = `You are the director of an AI video studio. Turn a user command into a production bible and a timed shot list for a short social video (25-55 seconds).

Return ONLY JSON:
{
  "bible": {
    "title": "string",
    "logline": "string",
    "format": "faceless" | "product" | "conversation" | "series",
    "niche": "string",
    "mood": "dark" | "neon" | "clean" | "warm" | "crime" | "playful",
    "aspect": "landscape" | "vertical" | "square",
    "characters": [{"id":"string","name":"string","role":"string","look":"string","voice":"narrator"|"warm"|"sharp"|"deep"|"bright","color":"#hex"}],
    "product": {"name":"string","tagline":"string","category":"string","features":["string"],"brandColor":"#hex"} | null,
    "captionTheme": "string",
    "voiceoverStyle": "string"
  },
  "episode": {
    "number": 1,
    "title": "string",
    "shots": [{
      "id": "string",
      "type": "title"|"hook"|"narration"|"dialogue"|"product"|"broll"|"text_message"|"cta",
      "speakerId": "character id or omit",
      "line": "spoken line",
      "onScreen": "short on-screen text",
      "visual": "what we see",
      "captionStyle": "kinetic"|"subtitle"|"none",
      "durationMs": 2200-7000
    }]
  },
  "seasonPlan": [{"number":1,"title":"string","logline":"string","hook":"string"}]
}

Rules:
- Keep characters and products visually locked across shots.
- Conversation format must alternate speakers.
- Series format must include 3+ episode outlines.
- Headlines punchy. Dialogue sounds spoken, not written.
- 6-10 shots. Total duration 25-55s.`;

function normalizeProduction(raw: Production, input: CommandInput): Production {
  const shots: Shot[] = (raw.episode?.shots || []).map((shot, index) => ({
    ...shot,
    id: shot.id || `shot-${index + 1}`,
    durationMs: Math.min(8000, Math.max(1800, shot.durationMs || 3500)),
    captionStyle: shot.captionStyle || (shot.type === "title" ? "none" : "kinetic"),
    line: shot.line || shot.onScreen || "",
    onScreen: shot.onScreen || shot.line?.slice(0, 48) || "",
    visual: shot.visual || "Cinematic B-roll",
    type: shot.type || "narration",
  }));

  if (shots.length === 0) {
    return generateTemplateProduction(input);
  }

  const totalDurationMs = shots.reduce((sum, shot) => sum + shot.durationMs, 0);
  return {
    bible: {
      ...raw.bible,
      format: raw.bible?.format || input.format,
      aspect: raw.bible?.aspect || input.aspect,
      characters: raw.bible?.characters?.length ? raw.bible.characters : generateTemplateProduction(input).bible.characters,
    },
    episode: {
      number: raw.episode?.number || 1,
      title: raw.episode?.title || raw.bible?.title || "Episode 1",
      recap: raw.episode?.recap,
      shots,
      totalDurationMs,
    },
    seasonPlan:
      raw.seasonPlan?.length > 0
        ? raw.seasonPlan
        : generateTemplateProduction(input).seasonPlan,
    source: "ai",
    estimatedCredits: estimateCredits(shots.length, input.format),
  };
}

export async function generateDirectorProduction(
  input: CommandInput,
  episodeNumber = 1
): Promise<Production> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-your")) {
    return generateTemplateProduction(input, episodeNumber);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o";
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            ...input,
            episodeNumber,
            instruction:
              episodeNumber > 1
                ? `Generate episode ${episodeNumber} only, keeping the same characters and product.`
                : "Generate episode 1 and the season plan.",
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty director response");
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as Production;
    return normalizeProduction(parsed, input);
  } catch (error) {
    console.error("Director AI failed, using template:", error);
    return generateTemplateProduction(input, episodeNumber);
  }
}
