import OpenAI from "openai";
import type { ClientBrief, GenerationResult, VideoScript } from "@/types";
import { generateTemplateScript } from "./template-script";

const SYSTEM_PROMPT = `You are an elite B2B video scriptwriter who creates cinematic, executive-level product demo videos for CEOs, CTOs, and marketing leaders.

Your scripts must be:
- Concise and impactful — every word earns its place
- Authority-building with confident, declarative language
- Structured for visual storytelling with clear scene transitions
- Tailored to the specified audience and tone

Return ONLY valid JSON matching this schema:
{
  "title": "string — video title",
  "scenes": [
    {
      "id": "unique string",
      "type": "intro" | "highlight" | "stats" | "cta" | "outro",
      "headline": "string — main on-screen text, max 8 words",
      "subheadline": "optional string — supporting line",
      "body": "optional string — detail text for highlight scenes",
      "metric": "optional string — bold stat or proof point",
      "durationMs": number between 3000 and 6000
    }
  ],
  "narratorNotes": "string — brief production notes for voiceover",
  "totalDurationMs": number — sum of scene durations
}

Scene structure:
1. intro — cinematic opening with product name and tagline
2. highlight — one scene per product highlight (use type "highlight")
3. stats — optional proof-point montage if metrics exist
4. cta — compelling call to action
5. outro — brand closing with client name

Keep total video between 25-45 seconds. Headlines must be punchy, not sentences.`;

function buildUserPrompt(brief: ClientBrief): string {
  const audienceLabels: Record<string, string> = {
    ceo: "CEO — focus on ROI, strategic advantage, market leadership",
    cto: "CTO — focus on architecture, scalability, security, integration",
    marketing: "CMO/Marketing — focus on brand impact, customer outcomes, differentiation",
    mixed: "C-suite mixed audience — balance strategic and technical proof points",
  };

  const toneLabels: Record<string, string> = {
    executive: "Polished, authoritative, boardroom-ready",
    technical: "Precise, credible, engineering-focused",
    visionary: "Aspirational, future-forward, transformative",
    bold: "Disruptive, confident, category-defining",
  };

  const highlightsText = brief.highlights
    .map(
      (h, i) =>
        `${i + 1}. ${h.title}\n   ${h.description}${h.metric ? `\n   Key metric: ${h.metric}` : ""}`
    )
    .join("\n\n");

  return `Create a professional demo video script for:

Client: ${brief.clientName}
Product: ${brief.productName}
Tagline: ${brief.tagline}
Industry: ${brief.industry}
Target audience: ${audienceLabels[brief.targetAudience]}
Tone: ${toneLabels[brief.tone]}
Call to action: ${brief.callToAction}

Product highlights to feature:
${highlightsText}

Generate the JSON script now.`;
}

function parseScriptResponse(content: string): VideoScript {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as VideoScript;

  if (!parsed.scenes?.length) {
    throw new Error("Invalid script: no scenes generated");
  }

  parsed.totalDurationMs = parsed.scenes.reduce((sum, s) => sum + (s.durationMs || 4000), 0);
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
    console.error("AI generation failed, falling back to template:", error);
    return {
      script: generateTemplateScript(brief),
      source: "template",
    };
  }
}
