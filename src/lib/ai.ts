import OpenAI from "openai";
import type { ClientBrief, GenerationResult, VideoScript } from "@/types";
import { generateTemplateScript } from "./director";

const SYSTEM_PROMPT = `You are a TV commercial director. You write 30-45 second spots with recurring characters, spoken dialogue, lived product moments, and photoreal camera plates — never slide-title films.

Return ONLY valid JSON:
{
  "title": "string",
  "logline": "one sentence",
  "scenes": [
    {
      "id": "unique string",
      "type": "intro" | "problem" | "highlight" | "quote" | "stats" | "cta" | "outro",
      "kicker": "uppercase shot label",
      "headline": "product super, short",
      "subheadline": "optional",
      "body": "optional",
      "metric": "optional",
      "voiceover": "narration",
      "dialogue": "what the character says on camera",
      "character": "name",
      "characterRole": "role",
      "location": "where we are",
      "imagePrompt": "photoreal cinematic TV commercial still, 16:9, no text, no logos, detailed character and action",
      "imageSeed": number,
      "durationMs": number between 3500 and 6000
    }
  ],
  "narratorNotes": "string",
  "totalDurationMs": number
}

Must include the same 1-2 characters across shots. Open on the hero's life, play the problem as an incident, then product beats with dialogue, then packshot CTA. Keep 8-11 shots.`;

function buildUserPrompt(brief: ClientBrief): string {
  const audienceLabels: Record<string, string> = {
    ceo: "CEO — ROI, strategic advantage, downside of delay",
    cto: "CTO — architecture, reliability, security, time-to-production",
    marketing: "CMO — category story, differentiation, memorable proof",
    mixed: "CEO + CTO + marketing in one room — balance stakes, system, and story",
  };

  const toneLabels: Record<string, string> = {
    executive: "Polished, authoritative, boardroom-ready",
    technical: "Precise, inspectable, engineering-credible",
    visionary: "Aspirational but concrete",
    bold: "Category-defining, still adult",
  };

  const highlightsText = brief.highlights
    .map((h, i) => {
      const kind = h.kind ? ` [${h.kind}]` : "";
      const metric = h.metric ? `\n   Metric: ${h.metric}` : "";
      return `${i + 1}. ${h.title}${kind}\n   ${h.description}${metric}`;
    })
    .join("\n\n");

  return `Direct an executive product film.

Client: ${brief.clientName}
Product: ${brief.productName}
Tagline: ${brief.tagline}
Industry: ${brief.industry}
Audience: ${audienceLabels[brief.targetAudience]}
Tone: ${toneLabels[brief.tone]}
Problem / stakes: ${brief.problemStatement}
Desired outcome: ${brief.desiredOutcome}
Customer quote: ${brief.customerQuote || "(none)"}
Quote attribution: ${brief.quoteAttribution || "(none)"}
Call to action: ${brief.callToAction}

Product callouts to feature, in order:
${highlightsText}`;
}

function parseScriptResponse(content: string): VideoScript {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as VideoScript;

  if (!parsed.scenes?.length) {
    throw new Error("Invalid script: no scenes generated");
  }

  parsed.totalDurationMs = parsed.scenes.reduce((sum, s) => sum + (s.durationMs || 4000), 0);
  parsed.logline = parsed.logline || parsed.title;
  return parsed;
}

export async function generateVideoScript(brief: ClientBrief): Promise<GenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-your")) {
    return {
      script: generateTemplateScript(brief),
      source: "template",
    };
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
        { role: "user", content: buildUserPrompt(brief) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    return {
      script: parseScriptResponse(content),
      source: "ai",
    };
  } catch (error) {
    console.error("AI generation failed, falling back to director engine:", error);
    return {
      script: generateTemplateScript(brief),
      source: "template",
    };
  }
}
